import logging
from abc import ABC, abstractmethod
from typing import List
from google import genai
from app.config.settings import settings

logger = logging.getLogger(__name__)

class EmbeddingNotConfiguredError(Exception):
    """Raised when an embedding provider cannot be initialized due to missing configuration."""
    pass

class EmbeddingProvider(ABC):
    """
    Abstract interface for embedding generation.
    """
    @abstractmethod
    def create_embeddings_batch(self, texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> List[List[float]]:
        """Generates embedding vectors for a batch of texts."""
        pass
        
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the name of the embedding provider."""
        pass
        
    @property
    @abstractmethod
    def dimension(self) -> int:
        """Returns the dimension of the embedding vectors."""
        pass

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            raise EmbeddingNotConfiguredError("GEMINI_API_KEY is not set or invalid.")
        try:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("GeminiEmbeddingProvider initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise EmbeddingNotConfiguredError(f"Failed to initialize Gemini: {e}")

    @property
    def provider_name(self) -> str:
        return "gemini"
        
    @property
    def dimension(self) -> int:
        return 1536

    def create_embeddings_batch(self, texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> List[List[float]]:
        if not texts:
            return []
        try:
            from google.genai import types
            results = []
            for text in texts:
                response = self.client.models.embed_content(
                    model="gemini-embedding-2",
                    contents=text,
                    config=types.EmbedContentConfig(
                        output_dimensionality=1536,
                        task_type=task_type
                    )
                )
                if response.embeddings:
                    results.append(response.embeddings[0].values)
            
            if results:
                return results
            raise ValueError("Received empty embeddings from API.")
        except Exception as e:
            logger.error(f"Gemini embedding batch failed: {e}")
            raise RuntimeError(f"Gemini API Error: {e}")

def get_embedding_provider() -> EmbeddingProvider:
    """
    Factory function to return the configured embedding provider.
    In the future, this can check an environment variable to select between
    Gemini, OpenAI, VoyageAI, etc.
    """
    return GeminiEmbeddingProvider()
