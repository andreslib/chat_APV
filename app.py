from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import json
import openai
import re
from werkzeug.middleware.proxy_fix import ProxyFix

# código de ahorro impuestos
from calculate_apv import calculate_apv_savings, recommend_best_regimen  # Import the module

# inicializa la app
app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Configura la API Key de OpenAI
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_KEY')
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_KEY environment variable is not set")
openai.api_key = OPENAI_API_KEY

# AI model
ai_model="gpt-4o-mini"

# Cargar el contexto
with open("contexto_APV.txt", 'r') as f:
    CONTEXT = f.read()

def formatear_links(texto):
    """Convierte URLs en enlaces HTML clickeables y elimina texto entre corchetes."""
    # Eliminar el formato Markdown [texto](URL) y dejar solo la URL en el enlace
    texto = re.sub(r"\[.*?\]\((https?://[^\s]+)\)", r'<a href="\1" target="_blank">\1</a>', texto)
    
    # Convertir URLs sueltas en enlaces clickeables, asegurando que no queden duplicadas
    texto = re.sub(r"(?<!href=\")\b(https?://[^\s]+)", r'<a href="\1" target="_blank">\1</a>', texto)

    return texto


# Función para interactuar con ChatGPT usando el contexto predefinido
def chat_with_gpt(user_question):
    rol_ai = f"""
    Eres un asistente experto en APV en Chile.
    Tu objetivo es ayudar de manera clara, cordial y paciente a personas interesadas en invertir en APV.
    Usa un lenguaje sencillo, positivo y motivador. Evita respuestas demasiado técnicas sin explicarlas.
    Siempre ofrécete a ayudar en cualquier otra duda que pueda tener el usuario.
    Si la pregunta no es sobre estos temas, entonces di que no sabes la respuesta o que no puedes ayudar.
    No entregues formulas matematicas en tu resultado.

    Además, si mencionas enlaces a sitios web, incluye la URL en la respuesta y asegúrate de que sea clickeable.
    """
    response = openai.chat.completions.create(
        model=ai_model,
        messages=[
            {"role": "system", "content": rol_ai},
            {"role": "system", "content": CONTEXT},
            {"role": "user", "content": user_question}
        ],
        temperature=0.7,
        max_tokens=300
    )
    
    respuesta_texto = response.choices[0].message.content.strip()
    respuesta_formateada = formatear_links(respuesta_texto)

    # 🔹 Generar sugerencia basada en la respuesta
    sugerencia_mensaje = f"""
    Basado en esta respuesta: "{respuesta_texto}", ¿qué pregunta relevante podría hacer el usuario a continuación?
    Responde solo con la pregunta sugerida, sin ninguna introducción ni explicación adicional.
    """
    
    sugerencia_respuesta = openai.chat.completions.create(
        model=ai_model,
        messages=[{"role": "system", "content": sugerencia_mensaje}],
        temperature=0.7,
        max_tokens=100
    )
    
    sugerencia = sugerencia_respuesta.choices[0].message.content.strip()

    return respuesta_formateada, sugerencia

@app.route('/')
def inicio():
    """Renderizar la interfaz del chatbot."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Maneja las preguntas del usuario y devuelve una respuesta"""
    pregunta = request.json.get("mensaje", "").lower()
    respuesta, sugerencia = chat_with_gpt(pregunta)

    return jsonify({"respuesta": respuesta, "sugerencia": sugerencia})

@app.route("/rate", methods=["POST"])
def rate():
    """Guarda el feedback del usuario para mejorar futuras respuestas."""
    data = request.json
    pregunta = data.get("pregunta", "")
    respuesta = data.get("respuesta", "")
    rating = data.get("rating", "")

    # Guardar feedback (se puede almacenar en una base de datos o archivo)
    with open("feedback.json", "a", encoding="utf-8") as f:
        json.dump({"pregunta": pregunta, "respuesta": respuesta, "rating": rating}, f, ensure_ascii=False)
        f.write("\n")

    return jsonify({"status": "ok"})

@app.route("/calculate_apv", methods=["POST"])
def calculate_apv():
    """Endpoint to calculate APV tax benefits."""
    data = request.json
    regimen = data.get("regimen")
    yearly_savings = data.get("yearly_savings")
    monthly_income = data.get("monthly_income")
    employment_type = data.get("employment_type")

    if not all([regimen, yearly_savings, monthly_income, employment_type]):
        return jsonify({"error": "Faltan algunos parámetros"}), 400

    result = calculate_apv_savings(regimen, yearly_savings, monthly_income, employment_type)
    return jsonify(result)

@app.route("/recommend_best", methods=["POST"])
def recommend_best():
    """Endpoint to calculate best APV regime."""
    data = request.json
    yearly_savings = data.get("yearly_savings")
    monthly_income = data.get("monthly_income")
    employment_type = data.get("employment_type")

    if not all([yearly_savings, monthly_income, employment_type]):
        return jsonify({"error": "Faltan algunos parámetros"}), 400

    result = recommend_best_regimen(yearly_savings, monthly_income, employment_type)
    return jsonify(result)


if __name__ == "__main__":
    # Only enable debug mode in development
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0')
