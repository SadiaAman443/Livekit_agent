import os
from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    response = client.models.embed_content(
        model="text-embedding-004",
        contents="test"
    )
    print("004 Success:", len(response.embeddings[0].values))
except Exception as e:
    print("004 Error:", e)

try:
    response = client.models.embed_content(
        model="gemini-embedding-2",
        contents="test"
    )
    print("2 Success:", len(response.embeddings[0].values))
except Exception as e:
    print("2 Error:", e)
