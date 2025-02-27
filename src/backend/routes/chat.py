from fastapi import APIRouter, Form, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from ..services.groq_service import GroqService
from ..models.chat import ChatResponse

router = APIRouter()
templates = Jinja2Templates(directory="src/frontend/templates")

# Create a dependency to get the GroqService
def get_groq_service():
    return GroqService()

@router.get("/", response_class=HTMLResponse)
async def get_chat(request: Request, groq_service: GroqService = Depends(get_groq_service)):
    # Reset conversation history when loading the page
    groq_service.reset_conversation()
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/chat", response_class=HTMLResponse)
async def chat(
    message: str = Form(...),
    model: str = Form(...),
    temperature: float = Form(...),
    max_tokens: int = Form(...),
    top_p: float = Form(...),
    stream: bool = Form(...),
    reasoning_format: str = Form(...),
    system_prompt: str = Form(...),
    groq_service: GroqService = Depends(get_groq_service)
):
    # Generate response from Groq
    assistant_message = await groq_service.generate_response(
        message=message,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        stream=stream,
        reasoning_format=reasoning_format,
        system_prompt=system_prompt
    )
    
    # Return HTML with the response
    return f"""
    <!DOCTYPE html>
    <html><body><p>{assistant_message}</p></body></html>
    """

@router.post("/clear-chat")
async def clear_chat(groq_service: GroqService = Depends(get_groq_service)):
    groq_service.reset_conversation()
    return {"status": "success"}