document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("toggle-dark-mode");
    const newChatButton = document.getElementById("new-chat-button");
    const chatbox = document.getElementById("chatbox");    
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    function addMessageToChat(text, sender) {
        let message = document.createElement("div");
        message.className = sender === "bot" ? "message bot-message" : "message user-message";
        
        if (sender === "bot") {
            message.innerHTML = text; // ✅ allows bold, links, etc.
        } else {
            message.innerText = text; // ✅ keep user input as plain text
        }

        chatbox.appendChild(message);
        // 🔹 Centrar el scroll en el inicio de la nueva respuesta en lugar del final
        setTimeout(() => {
            message.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }
    
    // 🔹 Mostrar mensaje de bienvenida
    showWelcomeMessage();

    function showWelcomeMessage() {
        setTimeout(() => {
            addMessageToChat("👋 ¡Hola! Soy APV Bot, tu asistente de APV.", "bot");
            addMessageToChat("💡 Puedo ayudarte con tus decisiones de ahorro usando APV o puedes explorar el chat por tu cuenta.", "bot");
            setTimeout(showAPVSuggestion, 1000); // Agregar el botón de sugerencia después de 1 segundo
        }, 500);
    }

    function showAPVSuggestion() {
        console.log("showAPVSuggestion() called"); // Debugging log
    
        let suggestionContainer = document.createElement("div");
        suggestionContainer.className = "suggestion-buttons";
    
        let button = document.createElement("button");
        button.className = "suggestion-button";
        button.innerText = "Ayúdame con mi APV";
    
        button.onclick = function () {
            console.log("Button clicked: Opening APV Form"); // Debugging log
            showApvForm();
        };
    
        suggestionContainer.appendChild(button);
    
        if (chatbox) {
            chatbox.appendChild(suggestionContainer);
            console.log("APV Suggestion button added to chatbox"); // Debugging log
        } else {
            console.error("Chatbox not found! Check HTML structure.");
        }
    }
    
    window.formatCurrencyInput = function(inputField) {
        if (!inputField || typeof inputField.value !== "string") return; // Prevent errors

        // Remove all non-numeric characters except digits
        let value = inputField.value.replace(/\D/g, "");
    
        // Prevent leading zeros
        value = value ? parseInt(value, 10).toString() : "0";
    
        // Format number with "." as thousands separator
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
        // Set formatted value back with "$" prefix
        inputField.value = `$${value}`;
    };
    
    window.formatCurrencyNumber = function(value) {
        if (typeof value !== "number") value = parseInt(value, 10) || 0;
        
        return `$${value.toLocaleString("es-CL")}`; // Format to Chilean Pesos (CLP)
    };

    // Close Form
    window.closeApvForm = function () {
        let formDiv = document.getElementById("apv-form-container");
        if (formDiv) {
            formDiv.remove(); // ✅ Removes the APV form from the DOM
        }
    };

    window.showApvForm = function() {
        
        let existingForm = document.getElementById("apv-form-container");
        if (existingForm) existingForm.remove();
        
        let formDiv = document.createElement("div");
        formDiv.id = "apv-form-container"; // Add ID for reference
        formDiv.classList.add("apv-form-container", "apv-form-popup"); // Mobile-friendly modal

        setTimeout(() => {
            formDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);

        formDiv.innerHTML = `
            <button class="close-btn" onclick="closeApvForm()">×</button> <!-- ✅ Moved this inside the form -->
            <div class="apv-form-content">
            <p class="apv-form-title">💡 Ingresa los datos para calcular tu beneficio tributario de APV.</p>
            
            <label for="regimen">Régimen:</label>
            <select id="regimen" class="apv-form-input">
                <option value="A">A</option>
                <option value="B">B</option>
            </select>

            <label for="yearly_savings">¿Cuánto quieres ahorrar al año en pesos?</label>
            <input type="text" id="yearly_savings" class="apv-form-input" placeholder="$100.000">

            <label for="monthly_income">¿Cuál es tu renta imponible mensual en pesos?</label>
            <input type="text" id="monthly_income" class="apv-form-input" placeholder="$1.000.000">

            <label for="employment_type">¿Eres Dependiente?</label>
            <select id="employment_type" class="apv-form-input">
                <option value="dependent">Dependiente</option>
                <option value="independent">Independiente</option>
            </select>

            <button class="apv-form-button" onclick="calculateApv()">Calcular ahorro APV</button>
        </div>
    `;

    chatbox.appendChild(formDiv);


        // 🔹 Attach event listeners AFTER the inputs exist
        setTimeout(() => {
            let yearlySavingsInput = document.getElementById("yearly_savings");
            let monthlyIncomeInput = document.getElementById("monthly_income");
    
            if (yearlySavingsInput && monthlyIncomeInput) {
                yearlySavingsInput.addEventListener("input", function () {
                    formatCurrencyInput(this);
                });
    
                monthlyIncomeInput.addEventListener("input", function () {
                    formatCurrencyInput(this);
                });
            } else {
                console.error("Yearly Savings or Monthly Income input field not found.");
            }
        }, 100); // Small delay ensures elements exist before adding event listeners
    }

    function cleanCurrencyInput(value) {
        return parseInt(value.replace(/\D/g, ""), 10) || 0;
    }

    window.calculateApv = function() {
        const regimen = document.getElementById("regimen").value;
        const yearlySavings = cleanCurrencyInput(document.getElementById("yearly_savings").value);
        const monthlyIncome = cleanCurrencyInput(document.getElementById("monthly_income").value);
        const employmentType = document.getElementById("employment_type").value;

        if (isNaN(yearlySavings) || isNaN(monthlyIncome)) {
            alert("Por favor, ingresa valores numéricos válidos.");
            return;
        }

        window.getBestAPV = function() {
            fetch("/recommend_best", {
                method: "POST",
                body: JSON.stringify({
                    yearly_savings: yearlySavings,
                    monthly_income: monthlyIncome,
                    employment_type: employmentType
                }),
                headers: { "Content-Type": "application/json" }
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    addMessageToChat(`❌ Error: ${data.error}`, "bot");
                } else {
                    let formattedSavingsHigher = formatCurrencyNumber(data.savings_higher);
                    let formattedSavingsLower = formatCurrencyNumber(data.savings_lower);
                    console.log("SO FAR SO GOOD")
                    if (data.best_regimen = "A") {
                        let message_new = addMessageToChat(`✅ En tu caso, el mejor régimen es ${data.best_regimen} con un ahorro de ${formattedSavingsHigher} pesos, que es mayor al ahorro de ${formattedSavingsLower} pesos si eliges el régimen B.`, "bot");
                    } else {
                        let message_new = addMessageToChat(`✅ En tu caso, el mejor régimen es ${data.best_regimen} con un ahorro de ${formattedSavingsHigher} pesos, que es mayor al ahorro de ${formattedSavingsLower} pesos si eliges el régimen A.`, "bot");
                    }
                addMessageToChat(
                    `Recuerda que puedes volver a este formulario en cualquier minuto escribiendo el mensaje <strong><a href="#" onclick="event.preventDefault(); showApvForm();" style="color: #007bff; text-decoration: none;">ayudaAPV</a></strong> (todo junto).`,
                    "bot"
                    );                
                setTimeout(() => {
                    addMessageToChat("¿Te gustaría que te ayude en algo más?", "bot")
                }, 1000);     
                }
            })
        }

        fetch("/calculate_apv", {
            method: "POST",
            body: JSON.stringify({
                regimen: regimen,
                yearly_savings: yearlySavings,
                monthly_income: monthlyIncome,
                employment_type: employmentType
            }),
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                addMessageToChat(`❌ Error: ${data.error}`, "bot");
            } else {
                let formattedSavings = formatCurrencyNumber(data.tax_savings);
                addMessageToChat(`✅ Con APV bajo el Régimen ${data.regimen} te ahorras ${formattedSavings} pesos.`, "bot");
            }
            // chatbox.appendChild(resultDiv);
        })

        setTimeout(() => {
            addMessageToChat("¿Te gustaría que te ayudemos a elegir en cuál régimen te conviene invertir, o tienes alguna otra pregunta?", "bot");
            setTimeout(() => {
                let oldSuggestions_intro = document.querySelectorAll(".suggestion-buttons");
                oldSuggestions_intro.forEach(element => element.remove());

                let suggestionContainer_intro = document.createElement("div");
                suggestionContainer_intro.className = "suggestion-buttons";
            
                let button_intro = document.createElement("button");
                button_intro.className = "suggestion-button";
                button_intro.innerText = "¿Cuál régimen me conviene?";

                button_intro.onclick = function () {
    
                    console.log("getBestAPV() called"); // Debugging log
                    getBestAPV();
                };
                suggestionContainer_intro.appendChild(button_intro);
                chatbox.appendChild(suggestionContainer_intro)
            }, 300); // Small delay ensures message appears first
        }, 500);


    };
    
    
    
    window.sendMessage = function sendMessage() {
        let userInput = document.getElementById('user-input').value;
        if (userInput.trim() === "") return;

        const normalized = userInput.trim().toLowerCase();

        // ✅ Always show the user's message first
        addMessageToChat(userInput, "user");

        // ✅ Then check for custom triggers
        if (normalized === "ayudaapv") {
            setTimeout(() => {
                addMessageToChat("Entendido 👍 Te mostraré el formulario APV.", "bot");
                showApvForm();
            }, 300); // Small delay to feel natural
            document.getElementById('user-input').value = "";
            return;
        }

        let oldSuggestions = document.querySelectorAll(".suggestion-buttons");
        oldSuggestions.forEach(element => element.remove());

        let userMessage = document.createElement("div");
        userMessage.className = "message user-message";
        // userMessage.innerText = userInput;
        // chatbox.appendChild(userMessage);

        let loader = document.getElementById('loader');
        if (loader) loader.style.display = "block";

        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: userInput })
        })
        .then(response => response.json())
        .then(data => {
            let botMessageContainer = document.createElement("div");
            botMessageContainer.style.display = "flex";
            botMessageContainer.style.flexDirection = "column";
            botMessageContainer.style.alignItems = "flex-start";

            let botMessage = document.createElement("div");
            botMessage.className = "message bot-message";
            botMessage.innerHTML = formatResponse(data.respuesta);
            botMessageContainer.appendChild(botMessage);
            chatbox.appendChild(botMessageContainer);

        // 🔹 Centrar el scroll en el inicio de la nueva respuesta en lugar del final
        setTimeout(() => {
            botMessage.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);

        // Agregar thumbs up/down alineados a la izquierda, debajo de la respuesta
        let ratingContainer = document.createElement("div");
        ratingContainer.className = "rating-container";

        let thumbsText = document.createElement("span");
        thumbsText.className = "rating-text";
        thumbsText.innerText = "¿Te ayudó esta respuesta?";

        let thumbsWrapper = document.createElement("div");
        thumbsWrapper.className = "thumbs-wrapper";

        let thumbsUp = document.createElement("button");
        thumbsUp.className = "thumbs-button";
        thumbsUp.innerHTML = "👍";
        thumbsUp.onclick = function() { sendRating(userInput, data.respuesta, "up", ratingContainer); };

        let thumbsDown = document.createElement("button");
        thumbsDown.className = "thumbs-button";
        thumbsDown.innerHTML = "👎";
        thumbsDown.onclick = function() { sendRating(userInput, data.respuesta, "down", ratingContainer); };

        thumbsWrapper.appendChild(thumbsUp);
        thumbsWrapper.appendChild(thumbsDown);
        ratingContainer.appendChild(thumbsText);
        ratingContainer.appendChild(thumbsWrapper);

        botMessageContainer.appendChild(ratingContainer); // 🔹 Aseguramos que los thumbs también se alineen

        // Espaciado extra antes de la sugerencia
        let space = document.createElement("div");
        space.style.height = "20px"; 
        chatbox.appendChild(space);

        // Crear nuevo botón de sugerencia
        if (data.sugerencia && data.sugerencia.trim() !== "") {
            let suggestionContainer = document.createElement("div");
            suggestionContainer.className = "suggestion-buttons";

            let button = document.createElement("button");
            button.className = "suggestion-button";
            button.innerText = data.sugerencia;
            button.onclick = function() { 
                document.getElementById('user-input').value = data.sugerencia; 
                sendMessage(); 
            };

            suggestionContainer.appendChild(button);
            chatbox.appendChild(suggestionContainer);
        }
    })
        .finally(() => {
            loader.style.display = "none";
        });
        
        document.getElementById('user-input').value = "";
    };

    window.scrollToBottom = function () {
        if (chatbox) {
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    };

    window.formatResponse = function formatResponse(text) {
        return text.replace(/\n/g, '<br>');
    };

    window.handleKeyPress = function handleKeyPress(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    };

    window.sendRating = function sendRating(userQuestion, botResponse, rating, ratingContainer) {
        fetch('/rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta: userQuestion, respuesta: botResponse, rating: rating })
        });

        let feedbackMessage = document.createElement("span");
        feedbackMessage.className = "feedback-message";
        feedbackMessage.innerText = "¡Gracias por tu feedback!";

        ratingContainer.innerHTML = ""; 
        ratingContainer.appendChild(feedbackMessage);

        setTimeout(() => {
            feedbackMessage.style.opacity = "0";
            setTimeout(() => ratingContainer.remove(), 500);
        }, 2000);
    };
});
