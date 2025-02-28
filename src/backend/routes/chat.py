from fastapi import APIRouter, Form, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from ..services.groq_service import GroqService
from ..models.chat import ChatResponse
import json

router = APIRouter()
templates = Jinja2Templates(directory="src/frontend/templates")

# Create a dependency to get the GroqService
def get_groq_service():
    return GroqService()

@router.get("/", response_class=HTMLResponse)
async def get_chat(request: Request, groq_service: GroqService = Depends(get_groq_service)):
    # Reset conversation history when loading the page
    groq_service.reset_conversation()
    
    # Get available models
    models_data = await groq_service.get_available_models()
    
    return templates.TemplateResponse(
        "index.html", 
        {
            "request": request,
            "models_by_owner": models_data["models_by_owner"],
            "sorted_owners": models_data["sorted_owners"]
        }
    )

@router.post("/chat")
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
    response_data = await groq_service.generate_response(
        message=message,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        stream=stream,
        reasoning_format=reasoning_format,
        system_prompt=system_prompt
    )
    
    if stream:
        # For streaming responses, return a StreamingResponse
        async def stream_generator():
            try:
                async for chunk_data in response_data:
                    # Convert numeric values to ensure proper JSON serialization
                    chunk_data["stats"]["total_tokens"] = int(chunk_data["stats"]["total_tokens"])
                    chunk_data["stats"]["tokens_per_second"] = float(chunk_data["stats"]["tokens_per_second"])
                    
                    # Send JSON with chunk and stats
                    yield f"data: {json.dumps(chunk_data)}\n\n"
            except Exception as e:
                print(f"Error in stream_generator: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream"
        )
    else:
        # For non-streaming responses, return clean HTML
        assistant_message = response_data["content"]
        usage_stats = response_data["usage"]
        
        # Ensure values are proper numbers with fallbacks
        try:
            total_tokens = int(usage_stats['total_tokens'])
        except (KeyError, ValueError, TypeError):
            total_tokens = 0

        try:
            tokens_per_second = float(usage_stats['tokens_per_second'])
        except (KeyError, ValueError, TypeError):
            tokens_per_second = 0.0
        
        # Process newlines in the message to convert them to <br> tags
        processed_message = assistant_message.replace('\n', '<br>')
        
        return f"""<!DOCTYPE html>
<html><body>
    <div data-total-tokens="{total_tokens}" data-tokens-per-second="{tokens_per_second}">
        <p>{processed_message}</p>
    </div>
</body></html>"""

@router.post("/clear-chat")
async def clear_chat(groq_service: GroqService = Depends(get_groq_service)):
    groq_service.reset_conversation()
    return {"status": "success"}