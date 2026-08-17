import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import Lead, Call, Callback
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhooks"])

@router.post("/webhooks/vobiz")
async def vobiz_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Dedicated POST /api/webhooks/vobiz endpoint for production Vobiz webhook handling.
    """
    try:
        payload = await request.json()
        logger.info(f"Received Vobiz webhook payload: {payload}")
    except Exception as e:
        logger.error(f"Error parsing Vobiz webhook JSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    vobiz_call_id = str(payload.get("call_id") or payload.get("id") or "")
    if not vobiz_call_id:
        return {"status": "ignored", "reason": "missing call_id"}

    transcript = payload.get("transcript")
    summary = payload.get("summary")
    recording_url = payload.get("recording_url")
    duration = payload.get("duration") or payload.get("call_duration")
    if duration is not None:
        try:
            duration = int(float(duration))
        except ValueError:
            duration = None
            
    variables = payload.get("variables", {})
    metadata = payload.get("metadata", {})
    
    lead_id_str = payload.get("lead_id") or variables.get("lead_id") or metadata.get("lead_id")
    customer_phone = payload.get("customer_number") or payload.get("phone") or payload.get("phone_number")

    # Try to find the lead
    db_lead = None
    if lead_id_str:
        try:
            # try parsing as UUID
            lead_uuid = uuid.UUID(str(lead_id_str))
            db_lead = db.query(Lead).filter(Lead.id == lead_uuid).first()
        except ValueError:
            pass

    if not db_lead and customer_phone:
        # try to find by phone
        db_lead = db.query(Lead).filter(Lead.phone_number == str(customer_phone)).first()

    if not db_lead:
        # Create a new lead if not found
        logger.info(f"Lead not found. Creating new lead for phone: {customer_phone}")
        new_lead = Lead(
            customer_name=customer_phone or "Unknown Customer",
            phone_number=customer_phone,
            status="NEW"
        )
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        db_lead = new_lead

    # Idempotency check: see if Call already exists
    db_call = db.query(Call).filter(Call.vobiz_call_id == vobiz_call_id).first()
    
    if db_call:
        logger.info(f"Updating existing Call {db_call.id} for vobiz_call_id {vobiz_call_id}")
        if transcript: db_call.transcript = transcript
        if summary: db_call.summary = summary
        if recording_url: db_call.recording_url = recording_url
        if duration: db_call.duration_seconds = duration
        db_call.status = "COMPLETED"
    else:
        logger.info(f"Creating new Call for vobiz_call_id {vobiz_call_id}")
        db_call = Call(
            lead_id=db_lead.id,
            vobiz_call_id=vobiz_call_id,
            transcript=transcript,
            summary=summary,
            recording_url=recording_url,
            duration_seconds=duration,
            status="COMPLETED"
        )
        db.add(db_call)

    # Check for callback requested in webhook payload
    callback_requested = payload.get("callback_requested") or variables.get("callback_requested")
    if callback_requested and str(callback_requested).lower() in ["true", "1", "yes", "y"]:
        # check if there's already a pending callback for this lead
        existing_cb = db.query(Callback).filter(Callback.lead_id == db_lead.id, Callback.status == "PENDING").first()
        if not existing_cb:
            new_cb = Callback(
                lead_id=db_lead.id,
                callback_requested=True,
                reason="Requested via Vobiz webhook",
                status="PENDING"
            )
            db.add(new_cb)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving webhook data: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    return {"status": "success", "call_id": str(db_call.id), "lead_id": str(db_lead.id)}
