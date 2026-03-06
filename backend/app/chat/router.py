from fastapi import APIRouter

from app.dependencies import ChatServiceDep

router = APIRouter()


@router.get("/history")
def get_history(chat_service: ChatServiceDep):
    return {"history": chat_service.get_history()}
