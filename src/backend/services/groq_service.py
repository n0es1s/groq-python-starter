from typing import List, Dict, Any, Optional
from groq import Groq
from ..config import settings

class GroqService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqService, cls).__new__(cls)
            cls._instance.client = Groq(api_key=settings.groq_api_key)
            cls._instance.conversation_history = []
        return cls._instance
    
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
    ) -> dict:
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

        # Print the entire response object (or first chunk when streaming)
        print("Groq API Response Started:")
        
        # Handle streaming responses if enabled
        if stream:
            # Return a generator that yields chunks
            async def response_generator():
                full_response = ""
                start_time = None
                token_count = 0
                
                for chunk in chat_completion:
                    if not start_time:
                        start_time = chunk.created
                        
                    if chunk.choices[0].delta.content is not None:
                        chunk_content = chunk.choices[0].delta.content
                        full_response += chunk_content
                        
                        # Better token estimation - count spaces plus 1 for typical token size
                        # This is still an estimate but better than 1:1 chunk:token
                        token_count = len(full_response.split()) + len(full_response) // 4
                        
                        # Calculate speed
                        elapsed_time = (chunk.created - start_time) / 1000  # ms to s
                        tokens_per_second = round(token_count / elapsed_time, 2) if elapsed_time > 0 else 0
                        
                        # Yield the chunk with current stats
                        yield {
                            "chunk": chunk_content,
                            "full_response": full_response,
                            "stats": {
                                "total_tokens": token_count,
                                "tokens_per_second": tokens_per_second
                            }
                        }
                
                # After streaming is complete, try to get actual token count from final chunk if available
                try:
                    if hasattr(chunk, 'usage') and chunk.usage:
                        final_token_count = chunk.usage.total_tokens
                        token_count = final_token_count
                except:
                    pass  # If not available, use our best estimate
                
                # Store the complete response in conversation history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": full_response
                })
            
            return response_generator()
        else:
            # Non-streaming response with full usage stats
            assistant_message = chat_completion.choices[0].message.content
            # Extract complete usage statistics
            usage = chat_completion.usage
            
            # Create a comprehensive stats dictionary
            usage_stats = {
                "total_tokens": usage.total_tokens if hasattr(usage, 'total_tokens') else 0,
                "tokens_per_second": round(usage.total_tokens / usage.total_time, 2) 
                             if hasattr(usage, 'total_tokens') and hasattr(usage, 'total_time') and usage.total_time > 0 
                             else 0.0,
                "prompt_tokens": usage.prompt_tokens if hasattr(usage, 'prompt_tokens') else None,
                "completion_tokens": usage.completion_tokens if hasattr(usage, 'completion_tokens') else None,
                "total_time": usage.total_time if hasattr(usage, 'total_time') else None,
                "prompt_time": usage.prompt_time if hasattr(usage, 'prompt_time') else None,
                "completion_time": usage.completion_time if hasattr(usage, 'completion_time') else None,
                "queue_time": usage.queue_time if hasattr(usage, 'queue_time') else None
            }
        
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })
            
            return {
                "content": assistant_message,
                "usage": usage_stats
            }

    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio using Groq's API."""
        # Placeholder - replace with actual implementation when Groq supports it
        # transcription = self.client.audio.transcriptions.create(file=audio_bytes)
        return "Audio transcription is not yet implemented in the Groq API"

    async def get_available_models(self):
        """Fetch all available models from Groq API and group them by owner."""
        model_list = self.client.models.list()
        
        # Create a dictionary to group models by owner
        models_by_owner = {}
        
        for model in model_list.data:
            model_info = {
                "id": model.id,
                "name": model.id.replace("-", " ").title(),
                "owner": model.owned_by,
                "context_window": model.context_window
            }
            
            # Group by owner
            owner = model.owned_by
            if owner not in models_by_owner:
                models_by_owner[owner] = []
            
            models_by_owner[owner].append(model_info)
        
        # Sort each owner's models by name
        for owner in models_by_owner:
            models_by_owner[owner].sort(key=lambda x: x["name"])
        
        # Sort the owners alphabetically
        sorted_owners = sorted(models_by_owner.keys())
        
        return {
            "models_by_owner": models_by_owner,
            "sorted_owners": sorted_owners
        }