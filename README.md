# Groq Python Starter

A comprehensive starter kit for using the Groq Inference API with Python and FastAPI.

## Screenshots

![Initial UI](https://imagedelivery.net/zXlq05wYFoBwvKqP-va6Ow/c0de54bf-9bd2-4ccc-cf92-321fee26cc00/public)

![Reasoning + Streaming](https://imagedelivery.net/zXlq05wYFoBwvKqP-va6Ow/c26fdb41-6f2b-42eb-82aa-261c9f6bba00/public)

## Video Demo

<video src="groq-python-starter.m4v" controls title="Groq Python Starter Demo"></video>


## Features

- FastAPI backend with organized routes and services
- User-friendly chat interface
- Support for all Groq models
- Customizable parameters (temperature, max tokens, etc.)
- Streaming response support
- Audio transcription endpoint (placeholder)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/n0es1s/groq-python-starter.git
   cd groq-python-starter
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Groq API key
   ```

5. **Run the application**
   ```bash
   python -m src.backend.main
   ```

6. **Open in your browser**
   Navigate to http://localhost:8000

## API Endpoints

### Chat

- `GET /` - Chat interface
- `POST /chat` - Send a message to the Groq API
- `POST /clear-chat` - Clear conversation history

### Audio

- `POST /audio/transcribe` - Transcribe audio using Groq (placeholder)

## Usage Examples

Check the `examples/` directory for standalone scripts demonstrating:
- Basic chat completion

## Project Structure
- `src/backend/` - FastAPI backend
  - `main.py` - FastAPI entry point
  - `config.py` - Configuration and settings
  - `models/` - Data models
  - `routes/` - API routes
  - `services/` - Business logic
- `src/frontend/` - Frontend templates and static files
  - `templates/` - HTML templates
  - `static/` - CSS, JS, and other static files
- `examples/` - Example scripts

## License

MIT