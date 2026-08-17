from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class LeadCreate(BaseModel):
    customer_name: str
    phone_number: Optional[str] = None
    project_name: Optional[str] = None
    status: Optional[str] = "NEW"

class LeadResponse(BaseModel):
    id: UUID
    customer_name: str
    phone_number: Optional[str] = None
    project_name: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CallCreate(BaseModel):
    lead_id: UUID
    livekit_call_id: Optional[str] = None
    livekit_room_id: Optional[str] = None
    vobiz_call_id: Optional[str] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: Optional[str] = "COMPLETED"

class CallResponse(BaseModel):
    id: UUID
    lead_id: UUID
    livekit_call_id: Optional[str] = None
    livekit_room_id: Optional[str] = None
    vobiz_call_id: Optional[str] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CallbackCreate(BaseModel):
    lead_id: UUID
    callback_requested: bool
    callback_date: Optional[str] = None
    callback_time: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = "PENDING"

class CallbackResponse(BaseModel):
    id: UUID
    lead_id: UUID
    callback_requested: bool
    callback_date: Optional[str] = None
    callback_time: Optional[str] = None
    reason: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Extra fields for list view joins
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}

class LeadUpdate(BaseModel):
    status: Optional[str] = None

class CallbackUpdate(BaseModel):
    status: Optional[str] = None

# Pagination wrappers
class PaginatedLeads(BaseModel):
    total: int
    items: list[LeadResponse]

class CallListResponse(BaseModel):
    id: UUID
    lead_id: UUID
    livekit_call_id: Optional[str] = None
    livekit_room_id: Optional[str] = None
    vobiz_call_id: Optional[str] = None
    recording_url: Optional[str] = None
    summary: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: str
    created_at: datetime
    
    # Extra fields for list view joins
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}

class PaginatedCalls(BaseModel):
    total: int
    items: list[CallListResponse]

class PaginatedCallbacks(BaseModel):
    total: int
    items: list[CallbackResponse]
