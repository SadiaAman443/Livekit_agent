from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database.session import get_db
from app.schemas.crm import (
    LeadCreate, LeadResponse, LeadUpdate,
    CallCreate, CallResponse, 
    CallbackCreate, CallbackResponse, CallbackUpdate
)
from app.services import crm_service

router = APIRouter(tags=["CRM"])

@router.post("/leads", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    return crm_service.create_lead(db, lead)

@router.post("/calls", response_model=CallResponse)
def create_call(call: CallCreate, db: Session = Depends(get_db)):
    return crm_service.create_call(db, call)

@router.post("/callbacks", response_model=CallbackResponse)
def create_callback(callback: CallbackCreate, db: Session = Depends(get_db)):
    return crm_service.create_callback(db, callback)

@router.get("/leads", response_model=List[LeadResponse])
def get_leads(
    status: Optional[str] = Query(None, description="Filter by lead status"),
    project_name: Optional[str] = Query(None, description="Filter by project name"),
    db: Session = Depends(get_db)
):
    return crm_service.get_leads(db, status=status, project_name=project_name)

@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: UUID, db: Session = Depends(get_db)):
    return crm_service.get_lead(db, lead_id)

@router.get("/leads/{lead_id}/calls", response_model=List[CallResponse])
def get_lead_calls(lead_id: UUID, db: Session = Depends(get_db)):
    return crm_service.get_lead_calls(db, lead_id)

@router.get("/leads/{lead_id}/callbacks", response_model=List[CallbackResponse])
def get_lead_callbacks(lead_id: UUID, db: Session = Depends(get_db)):
    return crm_service.get_lead_callbacks(db, lead_id)

@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: UUID, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    return crm_service.update_lead(db, lead_id, lead_update)

@router.patch("/callbacks/{callback_id}", response_model=CallbackResponse)
def update_callback(callback_id: UUID, callback_update: CallbackUpdate, db: Session = Depends(get_db)):
    return crm_service.update_callback(db, callback_id, callback_update)
