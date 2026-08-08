import os
from dotenv import load_dotenv; load_dotenv()
import sys
sys.path.append(os.getcwd())

from app.knowledge.embedding import get_embedding_provider

provider = get_embedding_provider()
print(f"Provider: {provider.provider_name}")
print(f"Declared Dimension: {provider.dimension}")

embeddings = provider.create_embeddings_batch(["Hello world", "This is a test"])
print(f"Number of embeddings generated: {len(embeddings)}")
if embeddings:
    print(f"Dimension of first embedding: {len(embeddings[0])}")
