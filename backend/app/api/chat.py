from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.rag_service import RAGService

router = APIRouter(tags=["Chat"])
logger = logging.getLogger(__name__)

def get_rag_service(db: Session = Depends(get_db)) -> RAGService:
    return RAGService(db)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Chat endpoint that uses Retrieval-Augmented Generation to answer questions.
    """
    try:
        response_text = rag_service.answer(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate response."
        )
