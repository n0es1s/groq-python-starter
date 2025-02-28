# Groq Python Starter

A comprehensive starter kit for using the Groq Inference API with Python and FastAPI.

## Screenshots

![Initial UI](https://imagedelivery.net/zXlq05wYFoBwvKqP-va6Ow/c0de54bf-9bd2-4ccc-cf92-321fee26cc00/public)

![Reasoning + Streaming](https://imagedelivery.net/zXlq05wYFoBwvKqP-va6Ow/c26fdb41-6f2b-42eb-82aa-261c9f6bba00/public)

## Video Demo

[![Groq Python Starter Demo](https://imagedelivery.net/zXlq05wYFoBwvKqP-va6Ow/b53d5d2c-8bd9-4bb8-38fe-8542a934b200/public)](https://customer-h1dmd6g74echkjh3.cloudflarestream.com/3b860dac186bb01b981b7f879e857724/watch)



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

## Known Issues 
- currently the total output tokens and tokens/second numbers are not accurate. Need to leverage the api response for actual data. 
- At times a reasoning model streaming with raw reasoning output may respond inside of an incomplete thinking: block. 
        ```
        <think>Some response to user... 
        ```
    This will cause the response to show inside the reasoning UI area instead of the assistant response message bubble 

- Tooltips are not always visible in the chat parameters side panel