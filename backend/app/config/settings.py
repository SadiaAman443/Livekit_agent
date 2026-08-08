import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "swargaseema-ai"
    
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Fallback logic for API keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    def __init__(self):
        if not self.DATABASE_URL:
            raise RuntimeError("Configuration Error: DATABASE_URL is missing. Please check your .env file.")
        
        # Don't strictly require Gemini key to be valid yet to allow CRUD dev
        if not self.GEMINI_API_KEY or self.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            pass # We will use dummy embeddings later

settings = Settings()
