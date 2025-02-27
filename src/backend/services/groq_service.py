from typing import List, Dict, Any, Optional
from groq import Groq
from ..config import settings

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.conversation_history: List[Dict[str, str]] = []
    
    def reset_conversation(self):
        """Reset the conversation history."""
        self.conversation_history = []
        
    def get_conversation_history(self):
        """Get the current conversation history."""
        return self.conversation_history
        
    async def generate_response(
        self, 
        message: str,
        model: str,
        temperature: float,
        max_tokens: int,
        top_p: float,
        stream: bool,
        reasoning_format: str,
        system_prompt: str
    ) -> str:
        """Generate a response from the Groq API."""
        # Initialize conversation with system prompt if conversation is empty
        if not self.conversation_history:
            self.conversation_history.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": message,
        })
        
        # Create completion parameters
        completion_params = {
            "messages": self.conversation_history,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "stream": stream,
        }
        
        # Add reasoning_format only for DeepSeek models
        if "deepseek" in model.lower() and reasoning_format != "none":
            completion_params["reasoning_format"] = reasoning_format
        
        # Get response from Groq
        chat_completion = self.client.chat.completions.create(**completion_params)
        
        # Handle streaming responses if enabled
        if stream:
            full_response = ""
            for chunk in chat_completion:
                if chunk.choices[0].delta.content is not None:
                    full_response += chunk.choices[0].delta.content
            assistant_message = full_response
        else:
            assistant_message = chat_completion.choices[0].message.content
        
        # Add assistant response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })
        
        return assistant_message

    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio using Groq's API."""
        # Placeholder - replace with actual implementation when Groq supports it
        # transcription = self.client.audio.transcriptions.create(file=audio_bytes)
        return "Audio transcription is not yet implemented in the Groq API"