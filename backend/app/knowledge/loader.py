import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DocumentLoader:
    """
    Utility class to load and extract text from supported document formats.
    """
    
    @staticmethod
    def load(file_path: str | Path) -> str:
        """
        Loads a document (TXT, PDF, DOCX) and extracts its text.
        
        Args:
            file_path: Path to the document.
            
        Returns:
            Extracted text as a single string.
            
        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file format is not supported.
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = file_path.suffix.lower()
        logger.info(f"Loading document: {file_path}")
        
        try:
            if ext == '.txt':
                return DocumentLoader._load_txt(file_path)
            elif ext == '.pdf':
                return DocumentLoader._load_pdf(file_path)
            elif ext == '.docx':
                return DocumentLoader._load_docx(file_path)
            else:
                raise ValueError(f"Unsupported file format: {ext}")
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            raise

    @staticmethod
    def _load_txt(file_path: Path) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    @staticmethod
    def _load_pdf(file_path: Path) -> str:
        try:
            import pypdf
        except ImportError:
            logger.error("pypdf is not installed.")
            raise ImportError("Please install pypdf to read PDF files: pip install pypdf")
        
        text = ""
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text

    @staticmethod
    def _load_docx(file_path: Path) -> str:
        try:
            import docx
        except ImportError:
            logger.error("python-docx is not installed.")
            raise ImportError("Please install python-docx to read DOCX files: pip install python-docx")
            
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
