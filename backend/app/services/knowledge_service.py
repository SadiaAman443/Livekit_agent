import os
import tempfile
import logging
import uuid
import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import UploadFile
from sqlalchemy.orm import Session
from pathlib import Path
import httpx
from bs4 import BeautifulSoup

from app.knowledge.loader import DocumentLoader
from app.knowledge.chunker import chunk_text
from app.knowledge.embedding import get_embedding_provider, EmbeddingNotConfiguredError
from app.knowledge.repository import KnowledgeRepository
from app.database.models import Document, DocumentChunk, Embedding, EmbeddingStatus

logger = logging.getLogger(__name__)

class KnowledgeService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = KnowledgeRepository(db)
        self.supported_extensions = {".pdf", ".docx", ".txt"}
        self.provider = None
        try:
            self.provider = get_embedding_provider()
        except EmbeddingNotConfiguredError:
            logger.warning("No embedding provider configured. Running in deferred mode.")

    async def _process_and_store(self, document_id: uuid.UUID, source_type: str, source_name: str, text: str):
        logger.info("Chunking text...")
        chunks = chunk_text(text)
        logger.info(f"Created {len(chunks)} chunks.")
        
        if not chunks:
            logger.warning("No chunks produced.")
            return

        document_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_hash = hashlib.sha256(chunk.encode('utf-8')).hexdigest()
            token_count = len(chunk) // 4
            dc = DocumentChunk(
                document_id=document_id,
                chunk_number=i+1,
                token_count=token_count,
                chunk_hash=chunk_hash,
                content=chunk,
                embedding_status=EmbeddingStatus.PENDING.value
            )
            document_chunks.append(dc)

        if self.provider:
            try:
                logger.info("Generating embeddings in batch...")
                embeddings = self.provider.create_embeddings_batch(chunks)
                for dc, emb in zip(document_chunks, embeddings):
                    dc.embedding_status = EmbeddingStatus.COMPLETED.value
                    e = Embedding(
                        embedding_model=self.provider.provider_name,
                        dimension=self.provider.dimension,
                        embedding_vector=emb
                    )
                    dc.embeddings.append(e)
            except Exception as e:
                logger.error(f"Failed to generate embeddings during upload: {e}")
                for dc in document_chunks:
                    dc.embedding_status = EmbeddingStatus.FAILED.value
                    dc.error_message = str(e)
                    dc.last_embedding_attempt = datetime.utcnow()

        logger.info("Saving chunks to database...")
        self.repository.save_chunks(document_id, document_chunks)

    def reindex_chunks(self, document_id: Optional[uuid.UUID] = None, source_type: Optional[str] = None) -> Dict[str, Any]:
        if not self.provider:
            raise RuntimeError("Cannot reindex: No embedding provider configured.")

        query = self.db.query(DocumentChunk).filter(
            DocumentChunk.embedding_status.in_([EmbeddingStatus.PENDING.value, EmbeddingStatus.FAILED.value])
        )
        if document_id:
            query = query.filter(DocumentChunk.document_id == document_id)
        if source_type:
            # Join Document to filter by document_type
            query = query.join(Document).filter(Document.document_type == source_type)

        chunks_to_process = query.all()
        logger.info(f"Reindex document_id: {document_id}")
        logger.info(f"Chunks found for reindex: {len(chunks_to_process)}")

        if chunks_to_process:
         logger.info(
        f"Chunk statuses: {[chunk.embedding_status for chunk in chunks_to_process]}"
    )
        if not chunks_to_process:
            return {"status": "success", "message": "No pending or failed chunks to reindex.", "processed": 0}

        for chunk in chunks_to_process:
            chunk.embedding_status = EmbeddingStatus.PROCESSING.value
        self.db.commit()

        processed_count = 0
        failed_count = 0
        batch_size = 50

        for i in range(0, len(chunks_to_process), batch_size):
            batch = chunks_to_process[i:i + batch_size]
            texts = [c.content for c in batch]
            try:
                embeddings = self.provider.create_embeddings_batch(texts)
                for chunk, emb in zip(batch, embeddings):
                    # Delete any old embeddings just in case
                    self.db.query(Embedding).filter(Embedding.chunk_id == chunk.id).delete()
                    
                    e = Embedding(
                        chunk_id=chunk.id,
                        company_id=chunk.company_id,
                        embedding_model=self.provider.provider_name,
                        dimension=self.provider.dimension,
                        embedding_vector=emb
                    )
                    self.db.add(e)
                    chunk.embedding_status = EmbeddingStatus.COMPLETED.value
                    chunk.error_message = None
                    chunk.last_embedding_attempt = datetime.utcnow()
                processed_count += len(batch)
            except Exception as e:
                logger.error(f"Reindex batch failed: {e}")
                for chunk in batch:
                    chunk.embedding_status = EmbeddingStatus.FAILED.value
                    chunk.error_message = str(e)
                    chunk.last_embedding_attempt = datetime.utcnow()
                failed_count += len(batch)
            self.db.commit()

        return {
            "status": "success",
            "message": f"Reindex complete. Processed: {processed_count}, Failed: {failed_count}",
            "processed": processed_count,
            "failed": failed_count
        }

    async def process_upload(self, file: UploadFile) -> Dict[str, Any]:
        ext = Path(file.filename).suffix.lower() if file.filename else ""
        if ext not in self.supported_extensions:
            raise ValueError(f"Unsupported file format: {ext}")

        content_hash = "" # Could hash the file here if needed
        doc = self.repository.create_document(
            source_type=ext.replace(".", ""),
            title=file.filename,
            original_filename=file.filename,
            content_hash=content_hash
        )

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        temp_file_path = temp_file.name
        
        try:
            content = await file.read()
            if not content:
                raise ValueError("The uploaded document is empty.")
            temp_file.write(content)
            temp_file.close()

            # Hash the file content
            doc.content_hash = hashlib.sha256(content).hexdigest()

            text = DocumentLoader.load(temp_file_path)
            if not text or not text.strip():
                raise ValueError("Could not extract any text from the document.")
            
            doc.raw_content = text
            doc.cleaned_content = text

            await self._process_and_store(doc.id, doc.document_type, doc.title, text)

            return {"document": doc.title, "document_id": str(doc.id), "status": "success"}
        except Exception as e:
            self.repository.delete_document(doc.id)
            raise e
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    async def add_url(self, url: str) -> Dict[str, Any]:
        doc = self.repository.create_document(
            source_type="url",
            title=url,
            source_url=url,
            content_hash=""
        )
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0, follow_redirects=True)
                response.raise_for_status()
                
            soup = BeautifulSoup(response.text, 'html.parser')
            for element in soup(["script", "style", "nav", "header", "footer", "noscript", "aside"]):
                element.decompose()
            
            text = soup.get_text(separator=' ', strip=True)
            if not text:
                raise ValueError("No readable text found on the page.")

            doc.content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            doc.raw_content = text
            doc.cleaned_content = text

            await self._process_and_store(doc.id, "url", url, text)
            return {"document": url, "document_id": str(doc.id), "status": "success"}
        except Exception as e:
            self.repository.delete_document(doc.id)
            raise RuntimeError(f"Failed to process URL: {e}")

    async def add_faq(self, question: str, answer: str) -> Dict[str, Any]:
        doc = self.repository.create_document(
            source_type="faq",
            title=question,
        )
        text = f"Question:\n{question}\n\nAnswer:\n{answer}"
        doc.content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        doc.raw_content = text
        doc.cleaned_content = text
        await self._process_and_store(doc.id, "faq", question, text)
        return {"document": question, "document_id": str(doc.id), "status": "success"}

    async def edit_faq(self, document_id: uuid.UUID, question: str, answer: str) -> Dict[str, Any]:
        doc = self.db.query(Document).filter(Document.id == document_id).first()
        if not doc or doc.document_type != "faq":
            raise ValueError("FAQ not found")
        
        doc.title = question
        self.db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        
        text = f"Question:\n{question}\n\nAnswer:\n{answer}"
        doc.content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        doc.raw_content = text
        doc.cleaned_content = text
        
        self.db.commit()
        await self._process_and_store(doc.id, "faq", question, text)
        return {"document": question, "document_id": str(doc.id), "status": "success"}

    async def add_note(self, title: str, content: str) -> Dict[str, Any]:
        doc = self.repository.create_document(
            source_type="note",
            title=title,
        )
        doc.content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        doc.raw_content = content
        doc.cleaned_content = content
        await self._process_and_store(doc.id, "note", title, content)
        return {"document": title, "document_id": str(doc.id), "status": "success"}
        
    async def edit_note(self, document_id: uuid.UUID, title: str, content: str) -> Dict[str, Any]:
        doc = self.db.query(Document).filter(Document.id == document_id).first()
        if not doc or doc.document_type != "note":
            raise ValueError("Note not found")
        
        doc.title = title
        self.db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        
        doc.content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        doc.raw_content = content
        doc.cleaned_content = content

        self.db.commit()
        await self._process_and_store(doc.id, "note", title, content)
        return {"document": title, "document_id": str(doc.id), "status": "success"}

    def get_documents(self, source_type: str = None, query: str = None) -> List[Dict[str, Any]]:
        docs = self.repository.get_documents(source_type, query)
        result = []
        for d in docs:
            status = "COMPLETED"
            if d.chunks:
                statuses = {c.embedding_status for c in d.chunks}
                if "FAILED" in statuses:
                    status = "FAILED"
                elif "PROCESSING" in statuses:
                    status = "PROCESSING"
                elif "PENDING" in statuses:
                    status = "PENDING"
            
            result.append({
                "id": str(d.id),
                "document": d.title,
                "source_type": d.document_type,
                "source_url": d.source_url,
                "chunks": len(d.chunks),
                "embedding_status": status,
                "uploaded_at": d.created_at.isoformat()
            })
        return result

    def get_stats(self) -> dict:
        return self.repository.get_stats()

    def delete_document(self, document_id: uuid.UUID) -> None:
        self.repository.delete_document(document_id)
