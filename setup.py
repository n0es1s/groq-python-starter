from fastapi import APIRouter, Form, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="src/frontend/templates")

@router.get("/", response_class=HTMLResponse)
async def get_chat(request):
    return templates.TemplateResponse("index.html", {"request": request})
