import time
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.knowledge.search import KnowledgeSearchService
from app.ai.gemini_service import GeminiService

logger = logging.getLogger(__name__)

class RAGService:
    """
    Orchestrates Retrieval-Augmented Generation (RAG).
    """
    def __init__(self, db: Session):
        self.db = db
        self.search_service = KnowledgeSearchService(db)
        self.gemini_service = GeminiService()

    def answer(self, question: str) -> str:
        """
        Answers a user question using RAG.
        """
        start_time = time.time()
        logger.info(f"Question received: {question}")
        
        # 1. Retrieve relevant chunks
        chunks = self.search_service.search(question, top_k=5)
        logger.info(f"Retrieved chunks count: {len(chunks)}")
        
        # 2. Check for empty results
        if not chunks:
            fallback = "I'm sorry, I couldn't find that information in the available knowledge. I can connect you with one of our sales specialists for accurate assistance."
            logger.info("No relevant chunks found. Returning fallback response.")
            return fallback
            
        # 3. Combine chunks into context
        context_texts = []
        for chunk in chunks:
            source = chunk.document.title if chunk.document and chunk.document.title else "Unknown Source"
            source_type = chunk.document.document_type.upper() if chunk.document and chunk.document.document_type else "UNKNOWN"
            context_texts.append(f"--- Source: {source} ({source_type}) ---\n{chunk.content}")
            
        context_string = "\n\n".join(context_texts)
        
        # 4. Read system prompt
        base_system_prompt = self._get_base_system_prompt()
        
        # 5. Construct final prompt with context and rules
        rag_prompt = f"""{base_system_prompt}

Context:
{context_string}

User Question:
{question}

Rules:
- Answer ONLY from the provided context.
- If the answer is unavailable, politely state that the information is not available.
- Never hallucinate.
- Never invent prices, ROI, approvals, availability, legal commitments, or future promises.
"""
        
        # 6. Call Gemini
        response = self.gemini_service.generate_response(
            message=question,
            system_prompt=rag_prompt
        )
        
        generation_time = time.time() - start_time
        logger.info(f"Response generation time: {generation_time:.2f} seconds")
        
        return response
        
    def _get_base_system_prompt(self) -> str:
        prompt_path = Path(__file__).parent.parent / "prompts" / "system_prompt.txt"
        system_prompt = "You are a helpful assistant."
        if prompt_path.exists():
            with open(prompt_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    system_prompt = content
        return system_prompt
