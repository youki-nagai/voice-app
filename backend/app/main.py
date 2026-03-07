from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.git.router import router as git_router
from app.voice.router import router as voice_router

app = FastAPI(title="voice-app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router, prefix="/api/voice", tags=["voice"])
app.include_router(git_router, prefix="/api/git", tags=["git"])

frontend_dist_path = Path(__file__).parent.parent.parent / "frontend" / "dist"
app.mount("/", StaticFiles(directory=str(frontend_dist_path), html=True), name="frontend")
