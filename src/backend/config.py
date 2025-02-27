# src/backend/config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Settings(BaseSettings):
    groq_api_key: str = os.getenv("GROQ_API_KEY")
    
    class Config:
        env_file = ".env"

settings = Settings()

if not settings.groq_api_key:
    raise ValueError("GROQ_API_KEY not set in environment")