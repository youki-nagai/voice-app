from fastapi import APIRouter

from app.dependencies import ChatServiceDep

router = APIRouter()


@router.get("/history")
def index(chat_service: ChatServiceDep):
    return {"history": chat_service._history}
