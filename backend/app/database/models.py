import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class EmbeddingStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class KnowledgeSource(Base):
    __tablename__ = 'knowledge_sources'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    name = Column(String(100), nullable=False)
    base_url = Column(String(2048), nullable=False)
    source_type = Column(String(30), nullable=False)
    config = Column(JSONB, default={}, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    documents = relationship("Document", back_populates="source")

class Document(Base):
    __tablename__ = 'documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey('knowledge_sources.id', ondelete='SET NULL'), nullable=True)
    title = Column(String(500), nullable=False)
    source_url = Column(String(2048), nullable=False)
    document_type = Column(String(30), nullable=False)
    language = Column(String(10), default='en', nullable=False)
    version = Column(Integer, default=1, nullable=False)
    content_hash = Column(String(64), nullable=False)
    raw_content = Column(Text, nullable=False)
    cleaned_content = Column(Text, nullable=False)
    metadata_ = Column('metadata', JSONB, default={}, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    source = relationship("KnowledgeSource", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan", passive_deletes=True)

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    chunk_number = Column(Integer, nullable=False)
    section = Column(String(255), nullable=True)
    page = Column(Integer, nullable=True)
    token_count = Column(Integer, default=0, nullable=False)
    chunk_hash = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    metadata_ = Column('metadata', JSONB, default={}, nullable=False)

    # Added columns for deferred embedding tracking
    embedding_status = Column(String(50), default="PENDING")
    last_embedding_attempt = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    document = relationship("Document", back_populates="chunks")
    embeddings = relationship("Embedding", back_populates="chunk", cascade="all, delete-orphan", passive_deletes=True)

class Embedding(Base):
    __tablename__ = 'embeddings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey('document_chunks.id', ondelete='CASCADE'), nullable=False)
    embedding_model = Column(String(64), nullable=False)
    dimension = Column(Integer, nullable=False)
    embedding_vector = Column(Vector(1536), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    chunk = relationship("DocumentChunk", back_populates="embeddings")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_name = Column(String(255), nullable=False)
    phone_number = Column(String(30), nullable=True)
    project_name = Column(String(255), nullable=True)

    status = Column(String(50), default="NEW", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    calls = relationship(
        "Call",
        back_populates="lead",
        cascade="all, delete-orphan"
    )

    callbacks = relationship(
        "Callback",
        back_populates="lead",
        cascade="all, delete-orphan"
    )


class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False
    )

    livekit_call_id = Column(String(255), nullable=True)
    livekit_room_id = Column(String(255), nullable=True)

    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

    duration_seconds = Column(Integer, nullable=True)

    status = Column(String(50), default="COMPLETED", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="calls")


class Callback(Base):
    __tablename__ = "callbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False
    )

    callback_requested = Column(Boolean, default=False, nullable=False)

    callback_date = Column(String(50), nullable=True)
    callback_time = Column(String(50), nullable=True)

    reason = Column(Text, nullable=True)

    status = Column(
        String(50),
        default="PENDING",
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    lead = relationship("Lead", back_populates="callbacks")
