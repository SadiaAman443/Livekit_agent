import logging
from typing import List
from sqlalchemy.orm import Session, joinedload
from app.database.models import DocumentChunk, Embedding, EmbeddingStatus
from app.knowledge.embedding import get_embedding_provider, EmbeddingNotConfiguredError

logger = logging.getLogger(__name__)

class KnowledgeSearchService:
    """
    Service responsible for vector similarity searches against the knowledge base.
    """
    def __init__(self, db: Session):
        self.db = db
        try:
            self.provider = get_embedding_provider()
        except EmbeddingNotConfiguredError:
            self.provider = None

    def search(self, query: str, top_k: int = 5) -> List[DocumentChunk]:
        """
        Search for the most relevant knowledge chunks using vector similarity.
        """
        if not query:
            return []
            
        if not self.provider:
            raise EmbeddingNotConfiguredError("Cannot search: Embedding provider not configured.")
            
        logger.info("Generating embedding for search query...")
        try:
            query_embedding = self.provider.create_embeddings_batch(
                [query], 
                task_type="RETRIEVAL_QUERY"
            )[0]
        except Exception as e:
            logger.error(f"Failed to embed search query: {e}")
            raise EmbeddingNotConfiguredError(f"Embedding API unavailable: {e}")
            
        logger.info(f"Performing pgvector cosine similarity search (top_k={top_k})...")
        distance_col = Embedding.embedding_vector.cosine_distance(query_embedding).label('distance')
        raw_results = (
            self.db.query(DocumentChunk, distance_col)
            .options(joinedload(DocumentChunk.document))
            .join(Embedding, DocumentChunk.id == Embedding.chunk_id)
            .filter(DocumentChunk.embedding_status == EmbeddingStatus.COMPLETED.value)
            .filter(Embedding.embedding_model == self.provider.provider_name)
            .order_by(distance_col)
            .limit(top_k)
            .all()
        )
        
        print(f"\n[SEARCH SERVICE] Found {len(raw_results)} results for query: '{query}'")
        
        results = []
        for i, (chunk, dist) in enumerate(raw_results):
            score = 1.0 - dist
            doc_title = chunk.document.title if chunk.document else "Unknown"
            doc_id = chunk.document_id
            print(f"  Result {i+1}:")
            print(f"    Document ID: {doc_id}")
            print(f"    Document Title: {doc_title}")
            print(f"    Chunk ID: {chunk.id}")
            print(f"    Similarity Score: {score:.4f}")
            # Replace rupees symbol to avoid print crash on windows terminal
            safe_content = chunk.content[:200].replace('\u20b9', 'Rs.')
            print(f"    Snippet: {safe_content}...\n")
            results.append(chunk)
            
        logger.info(f"Found {len(results)} relevant chunks.")
        return results
