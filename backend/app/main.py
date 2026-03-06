from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.chat.router import router as chat_router
from app.voice.router import router as voice_router

app = FastAPI(title="voice-app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router, prefix="/api/voice", tags=["voice"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

frontend_path = Path(__file__).parent.parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
