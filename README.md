# APV Chat Assistant

A Flask-based web application that provides an AI-powered chat interface for answering questions about APV (Ahorro Previsional Voluntario) in Chile. The application includes features for calculating APV tax benefits and providing personalized recommendations.

## Features

- AI-powered chat interface for APV-related questions
- APV tax benefit calculations
- Best regime recommendations
- User feedback collection
- Secure API key handling
- Modern web interface

## Prerequisites

- Python 3.8 or higher
- OpenAI API key
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat_APV
```

2. Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following content:
```
OPENAI_KEY=your_openai_api_key_here
FLASK_ENV=development  # Set to 'production' in production environment
```

## Running the Application

1. Development mode:
```bash
python app.py
```

2. Production mode (using Gunicorn):
```bash
gunicorn app:app
```

The application will be available at `http://localhost:5000` by default.

## Security Considerations

- API keys are stored in environment variables
- Security headers are implemented to protect against common web vulnerabilities
- Debug mode is disabled in production
- Input validation is implemented for all endpoints
- HTTPS is enforced in production

## Project Structure

```
chat_APV/
├── app.py              # Main application file
├── calculate_apv.py    # APV calculation logic
├── contexto_APV.txt    # Context file for AI responses
├── requirements.txt    # Python dependencies
├── templates/         # HTML templates
│   └── index.html    # Main chat interface
└── .env              # Environment variables (not in version control)
```

## Dependencies

The project uses the following main dependencies (see `requirements.txt` for complete list):

- Flask==3.1.0
- openai==1.66.5
- python-dotenv==1.0.1
- gunicorn==23.0.0
- Werkzeug==3.1.3

## API Endpoints

- `GET /`: Main chat interface
- `POST /chat`: Process chat messages
- `POST /rate`: Store user feedback
- `POST /calculate_apv`: Calculate APV tax benefits
- `POST /recommend_best`: Get best APV regime recommendation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that is short and to the point. It lets people do anything they want with your code as long as they provide attribution back to you and don't hold you liable. 