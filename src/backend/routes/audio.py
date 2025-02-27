from fastapi import APIRouter, File, UploadFile, Depends
from ..services.groq_service import GroqService
from ..models.chat import TranscriptionResponse

router = APIRouter()

# Create a dependency to get the GroqService
def get_groq_service():
    return GroqService()

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    groq_service: GroqService = Depends(get_groq_service)
):
    audio_bytes = await file.read()
    transcription = await groq_service.transcribe_audio(audio_bytes)
    return {"transcription": transcription}