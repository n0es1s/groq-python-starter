from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    model: str
    temperature: float
    max_tokens: int
    top_p: float
    stream: bool
    reasoning_format: str
    system_prompt: str

class ChatResponse(BaseModel):
    response: str

class TranscriptionResponse(BaseModel):
    transcription: str