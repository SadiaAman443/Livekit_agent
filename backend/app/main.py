from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import logging

from app.api.routes import router as api_router
from app.database.session import engine
from app.config.settings import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✓ Environment Loaded")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ PostgreSQL Connected")
    except Exception as e:
        print(f"✗ PostgreSQL Connection Failed: {e}")
        logger.error(f"Database connection failed: {e}")
        raise RuntimeError("Could not connect to PostgreSQL. Check DATABASE_URL in .env") from e
    
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
        print("✓ Gemini Configuration Loaded")
    else:
        print("⚠ Gemini Configuration Missing (Running in CRUD-only mode with dummy embeddings)")
        
    yield

app = FastAPI(
    title="swargaseema-ai API",
    description="Backend for swargaseema-ai",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "healthy"}

# Include API router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
