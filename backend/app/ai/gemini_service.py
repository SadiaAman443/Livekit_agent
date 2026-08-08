import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.config.settings import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """
        Initialize the Google Gemini client.
        """
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")
        
        try:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model_name = "gemini-2.5-flash"
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise RuntimeError(f"Could not initialize Gemini service: {e}")

    def generate_response(self, message: str, system_prompt: str) -> str:
        """
        Generates a plain text response from the Gemini model.
        
        Args:
            message (str): The user's input message.
            system_prompt (str): The system prompt to guide the model's behavior.
            
        Returns:
            str: The generated text response.
            
        Raises:
            RuntimeError: If there's an error calling the Gemini API.
        """
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=message,
                config=config,
            )
            
            if response.text is None:
                raise RuntimeError("Received empty response from Gemini API.")
                
            return response.text
        except APIError as e:
            logger.error(f"Gemini API Error: {e}")
            raise RuntimeError(f"Gemini API request failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during generation: {e}")
            raise RuntimeError(f"An unexpected error occurred during generation: {e}")

if __name__ == "__main__":
    # Test block for independent testing
    # To run this, you must have GEMINI_API_KEY set in your .env or environment
    logging.basicConfig(level=logging.INFO)
    
    try:
        service = GeminiService()
        print("Service initialized successfully.")
        
        sys_prompt = "You are a helpful assistant. Reply with short and concise answers."
        user_msg = "Hello! Can you tell me what 2 + 2 is?"
        
        print("Sending test request...")
        result = service.generate_response(user_msg, sys_prompt)
        print("\n--- Response ---")
        print(result)
        print("----------------")
    except Exception as e:
        print(f"Error running test: {e}")
