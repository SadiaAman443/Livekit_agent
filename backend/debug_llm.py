import os, sys
import asyncio
sys.path.append(os.getcwd())
from dotenv import load_dotenv; load_dotenv()

from app.database.session import SessionLocal
from app.knowledge.search import KnowledgeSearchService
from app.ai.agent import _get_base_system_prompt, KnowledgeBaseContext
from google import genai

def main():
    db = SessionLocal()
    search_service = KnowledgeSearchService(db)
    ctx = KnowledgeBaseContext()
    
    queries = [
        'What is the total area of Ameya project?',
        'What is the price of Vibhava?',
        'What is the RERA registration number of Ameya?',
        'How can I arrange a site visit and what is the phone number?'
    ]

    client = genai.Client()
    print("\n==== LLM Grounding Debugging ====")
    
    system_instruction = _get_base_system_prompt()
    
    for q in queries:
        print(f"\n\n--- Query: {q} ---")
        
        # Simulate tool retrieval
        context_str = ctx.search_knowledge(q)
        print(">> Retrieved Context Length:", len(context_str))
        
        prompt = f"User Question: {q}\n\nTool Output:\n{context_str}"
        
        try:
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config={'system_instruction': system_instruction}
            )
            print(">> LLM Answer:")
            print(response.text)
        except Exception as e:
            print("LLM Error:", e)

if __name__ == "__main__":
    main()
