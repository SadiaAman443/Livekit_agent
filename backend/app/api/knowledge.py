from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
import uuid

from app.database.session import get_db
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])
logger = logging.getLogger(__name__)

class UrlRequest(BaseModel):
    url: str

class FaqRequest(BaseModel):
    question: str
    answer: str

class NoteRequest(BaseModel):
    title: str
    content: str

def get_knowledge_service(db: Session = Depends(get_db)) -> KnowledgeService:
    return KnowledgeService(db)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.process_upload(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unexpected error occurred.")

@router.post("/url")
async def add_url(
    req: UrlRequest,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.add_url(req.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/faq")
async def add_faq(
    req: FaqRequest,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.add_faq(req.question, req.answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/note")
async def add_note(
    req: NoteRequest,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.add_note(req.title, req.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/faq/{document_id}")
async def edit_faq(
    document_id: uuid.UUID,
    req: FaqRequest,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.edit_faq(document_id, req.question, req.answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/note/{document_id}")
async def edit_note(
    document_id: uuid.UUID,
    req: NoteRequest,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return await service.edit_note(document_id, req.title, req.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex")
async def reindex_all(
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return service.reindex_chunks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reindex/{document_id}")
async def reindex_document(
    document_id: uuid.UUID,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return service.reindex_chunks(document_id=document_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def get_documents(
    source_type: Optional[str] = None,
    query: Optional[str] = None,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return service.get_documents(source_type, query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        return service.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/document/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    service: KnowledgeService = Depends(get_knowledge_service)
):
    try:
        service.delete_document(document_id)
        return {"status": "success", "message": f"Document {document_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
