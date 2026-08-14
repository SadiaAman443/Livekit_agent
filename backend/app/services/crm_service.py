from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from uuid import UUID

from app.database.models import Lead, Call, Callback
from app.schemas.crm import LeadCreate, CallCreate, CallbackCreate, LeadUpdate, CallbackUpdate

def create_lead(db: Session, lead_data: LeadCreate) -> Lead:
    try:
        db_lead = Lead(**lead_data.model_dump())
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return db_lead
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def create_call(db: Session, call_data: CallCreate) -> Call:
    db_lead = db.query(Lead).filter(Lead.id == call_data.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    try:
        db_call = Call(**call_data.model_dump())
        db.add(db_call)
        db.commit()
        db.refresh(db_call)
        return db_call
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def create_callback(db: Session, callback_data: CallbackCreate) -> Callback:
    db_lead = db.query(Lead).filter(Lead.id == callback_data.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    try:
        db_callback = Callback(**callback_data.model_dump())
        db.add(db_callback)
        db.commit()
        db.refresh(db_callback)
        return db_callback
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_leads(db: Session, status: Optional[str] = None, project_name: Optional[str] = None) -> List[Lead]:
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if project_name:
        query = query.filter(Lead.project_name == project_name)
    return query.order_by(Lead.created_at.desc()).all()

def get_lead(db: Session, lead_id: UUID) -> Lead:
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead

def get_lead_calls(db: Session, lead_id: UUID) -> List[Call]:
    get_lead(db, lead_id) # validates lead exists
    return db.query(Call).filter(Call.lead_id == lead_id).order_by(Call.created_at.desc()).all()

def get_lead_callbacks(db: Session, lead_id: UUID) -> List[Callback]:
    get_lead(db, lead_id) # validates lead exists
    return db.query(Callback).filter(Callback.lead_id == lead_id).order_by(Callback.created_at.desc()).all()

def update_lead(db: Session, lead_id: UUID, lead_update: LeadUpdate) -> Lead:
    db_lead = get_lead(db, lead_id)
    if lead_update.status is not None:
        db_lead.status = lead_update.status
    
    try:
        db.commit()
        db.refresh(db_lead)
        return db_lead
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def update_callback(db: Session, callback_id: UUID, callback_update: CallbackUpdate) -> Callback:
    db_callback = db.query(Callback).filter(Callback.id == callback_id).first()
    if not db_callback:
        raise HTTPException(status_code=404, detail="Callback not found")
        
    if callback_update.status is not None:
        db_callback.status = callback_update.status
        
    try:
        db.commit()
        db.refresh(db_callback)
        return db_callback
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

