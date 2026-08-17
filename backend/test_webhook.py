import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_vobiz_webhook():
    print("Sending mock Vobiz webhook...")
    
    # Let's create a lead first or rely on the webhook to create one via phone number
    payload = {
        "call_id": f"vobiz_{uuid.uuid4().hex[:8]}",
        "phone": "+1234567890",
        "transcript": "Agent: Hello!\nUser: Hi, I'm interested.",
        "summary": "User showed interest.",
        "recording_url": "https://example.com/recording.mp3",
        "duration": "120",
        "variables": {
            "callback_requested": "true"
        }
    }
    
    r = requests.post(f"{BASE_URL}/api/webhooks/vobiz", json=payload)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
    
    if r.status_code == 200:
        data = r.json()
        print("\nVerifying if it was idempotent...")
        r2 = requests.post(f"{BASE_URL}/api/webhooks/vobiz", json=payload)
        print(f"Idempotent Status: {r2.status_code}")
        print(f"Idempotent Response: {r2.text}")

if __name__ == "__main__":
    test_vobiz_webhook()
