import os, sys
import asyncio
sys.path.append(os.getcwd())
from dotenv import load_dotenv; load_dotenv()

from app.database.session import SessionLocal
from app.knowledge.search import KnowledgeSearchService

def test_search():
    db = SessionLocal()
    search_service = KnowledgeSearchService(db)
    
    queries = [
        "What is the location of Suketana project?",
        "What is the price of Vibhava project?",
        "What is the total area of Ameya project?",
        "What is the phone number for arranging a site visit?"
    ]

    print("\n==== DIRECT RAG TOOL TEST ====")
    for q in queries:
        try:
            print(f"\n=================================")
            print(f"QUERY: {q}")
            results = search_service.search(q, top_k=3)
            # The search function now prints everything internally.
        except Exception as e:
            print(f"Error testing query '{q}': {e}")

if __name__ == "__main__":
    test_search()
