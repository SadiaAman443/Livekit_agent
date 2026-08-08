import logging
from typing import List

logger = logging.getLogger(__name__)

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Splits text into smaller chunks with a specified size and overlap.
    
    Args:
        text: The complete text to be chunked.
        chunk_size: The maximum number of characters per chunk.
        overlap: The number of characters to overlap between consecutive chunks.
        
    Returns:
        A list of string chunks.
    """
    if not text:
        return []
        
    logger.info(f"Chunking text (size={chunk_size}, overlap={overlap})")
    
    chunks = []
    start = 0
    text_length = len(text)
    
    # Ensure progress is made even if overlap is somehow larger than chunk_size
    step = max(1, chunk_size - overlap)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += step
        
    logger.info(f"Generated {len(chunks)} chunks.")
    return chunks
