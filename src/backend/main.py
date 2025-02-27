from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .routes import chat, audio

# Create the FastAPI app
app = FastAPI(title="Groq FastAPI Starter")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="src/frontend/static"), name="static")

# Include API routes
app.include_router(chat.router)
app.include_router(audio.router, prefix="/audio")

# Add routes for __init__ files
if __name__ == '__main__':
    import uvicorn
    uvicorn.run("src.backend.main:app", host="0.0.0.0", port=8000, reload=True)