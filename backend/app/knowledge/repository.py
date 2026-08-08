import logging
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import Document, DocumentChunk, EmbeddingStatus

logger = logging.getLogger(__name__)

class KnowledgeRepository:
    """
    Repository for managing Document and DocumentChunk records in the database.
    """
    def __init__(self, db_session: Session):
        self.db = db_session

    def create_document(self, source_type: str, title: str, original_filename: str = None, source_url: str = None, content_hash: str = "") -> Document:
        doc = Document(
            document_type=source_type,
            title=title,
            source_url=source_url or "",
            content_hash=content_hash,
            raw_content="",
            cleaned_content="",
            metadata_={"original_filename": original_filename} if original_filename else {}
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def save_chunks(self, document_id: uuid.UUID, chunks: List[DocumentChunk]) -> None:
        """
        Saves a list of DocumentChunk instances.
        """
        if not chunks:
            logger.warning("No chunks provided to save.")
            return

        try:
            self.db.add_all(chunks)
            self.db.commit()
            logger.info(f"Successfully saved {len(chunks)} knowledge chunks for document {document_id}.")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to save chunks: {e}")
            raise

    def get_documents(self, source_type: Optional[str] = None, query: Optional[str] = None) -> List[Document]:
        """
        Retrieves all documents, optionally filtered by source_type and search query.
        """
        db_query = self.db.query(Document).filter(Document.is_deleted == False)
        if source_type:
            db_query = db_query.filter(Document.document_type == source_type)
        if query:
            db_query = db_query.filter(Document.title.ilike(f"%{query}%"))
        return db_query.order_by(Document.created_at.desc()).all()

    def get_stats(self) -> dict:
        """
        Returns stats for the dashboard.
        """
        status_counts = dict(
            self.db.query(DocumentChunk.embedding_status, func.count(DocumentChunk.id))
            .filter(DocumentChunk.is_deleted == False)
            .group_by(DocumentChunk.embedding_status)
            .all()
        )
        
        stats = {
            "total_documents": self.db.query(Document).filter(Document.document_type.in_(["pdf", "docx", "txt"]), Document.is_deleted == False).count(),
            "total_urls": self.db.query(Document).filter(Document.document_type == "url", Document.is_deleted == False).count(),
            "total_faqs": self.db.query(Document).filter(Document.document_type == "faq", Document.is_deleted == False).count(),
            "total_notes": self.db.query(Document).filter(Document.document_type == "note", Document.is_deleted == False).count(),
            "total_chunks": sum(status_counts.values()),
            "pending_embeddings": status_counts.get(EmbeddingStatus.PENDING, 0),
            "processing_embeddings": status_counts.get(EmbeddingStatus.PROCESSING, 0),
            "completed_embeddings": status_counts.get(EmbeddingStatus.COMPLETED, 0),
            "failed_embeddings": status_counts.get(EmbeddingStatus.FAILED, 0)
        }
        return stats

    def delete_document(self, document_id: uuid.UUID) -> None:
        """
        Soft deletes a document and its cascading chunks.
        """
        try:
            doc = self.db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.is_deleted = True
                for chunk in doc.chunks:
                    chunk.is_deleted = True
                self.db.commit()
                logger.info(f"Successfully soft deleted document ID: {document_id}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete document {document_id}: {e}")
            raise
