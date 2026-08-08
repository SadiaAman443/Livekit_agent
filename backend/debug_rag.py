import os, sys
import asyncio
sys.path.append(os.getcwd())
from dotenv import load_dotenv; load_dotenv()

from app.database.session import SessionLocal
from app.knowledge.search import KnowledgeSearchService
from app.database.models import DocumentChunk, Embedding, EmbeddingStatus
from livekit.agents import llm
from livekit.plugins import google
from app.ai.agent import _get_base_system_prompt, KnowledgeBaseContext
from app.knowledge.embedding import get_embedding_provider
import traceback

async def main():
    db = SessionLocal()
    search_service = KnowledgeSearchService(db)
    provider = get_embedding_provider()
    
    queries = [
        'Ameya total area',
        'Vibhava price',
        'Ameya RERA registration number',
        'site visit phone number'
    ]

    llm_model = google.LLM(model="gemini-1.5-flash")

    print("\n==== RAG Debugging ====")
    
    for q in queries:
        print(f"\n\n--- Query: {q} ---")
        
        # 1. Direct search to see chunks & scores by running custom query
        print(">> Direct Search Results:")
        try:
            query_embedding = provider.create_embeddings_batch([q])[0]
            distance_col = Embedding.embedding_vector.cosine_distance(query_embedding).label('distance')
            
            results = (
                db.query(DocumentChunk, distance_col)
                .join(Embedding, DocumentChunk.id == Embedding.chunk_id)
                .filter(DocumentChunk.embedding_status == EmbeddingStatus.COMPLETED.value)
                .order_by(distance_col)
                .limit(3)
                .all()
            )
            
            for i, (chunk, dist) in enumerate(results):
                score = 1.0 - dist  # Cosine similarity = 1 - Cosine distance
                doc_title = chunk.document.title if chunk.document else 'Unknown'
                print(f"Result {i+1}: ChunkID={chunk.id} | Doc={doc_title} | Score={score:.4f}")
                
                # Fix unicode issues on windows
                content = chunk.content[:150].replace('\u20b9', 'Rs.')
                print(f"Snippet: {content}...\n")
                
        except Exception as e:
            print("Search failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
