import requests
from uuid import uuid4
from app.database.session import engine
from sqlalchemy import text

BASE_URL = "http://localhost:8000"

def test_live():
    print("1. Testing GET /health...")
    r = requests.get(f"{BASE_URL}/health")
    print(f"Status: {r.status_code}, Response: {r.text}")

    print("\n2. Testing POST /api/leads...")
    lead_payload = {
        "customer_name": "CRM API Test",
        "phone_number": "9999999999",
        "project_name": "Integration Test"
    }
    r = requests.post(f"{BASE_URL}/api/leads", json=lead_payload)
    print(f"Status: {r.status_code}, Response: {r.text}")
    lead_id = r.json().get("id")
    print(f"Captured Lead ID: {lead_id}")

    print("\n3. Testing POST /api/calls...")
    call_payload = {
        "lead_id": lead_id,
        "summary": "Live test call",
        "duration_seconds": 300
    }
    r = requests.post(f"{BASE_URL}/api/calls", json=call_payload)
    print(f"Status: {r.status_code}, Response: {r.text}")

    print("\n4. Testing POST /api/callbacks...")
    callback_payload = {
        "lead_id": lead_id,
        "callback_requested": True,
        "reason": "Test Callback"
    }
    r = requests.post(f"{BASE_URL}/api/callbacks", json=callback_payload)
    print(f"Status: {r.status_code}, Response: {r.text}")

    print("\n5. Testing 404 for Invalid Lead ID...")
    fake_id = str(uuid4())
    r = requests.post(f"{BASE_URL}/api/calls", json={
        "lead_id": fake_id,
        "summary": "Should fail"
    })
    print(f"Status: {r.status_code}, Response: {r.text}")

    print("\n6. Verifying /api/knowledge and /api/chat...")
    # Sending empty requests to see if they exist (expecting 405 or 422, NOT 404)
    r_chat = requests.post(f"{BASE_URL}/api/chat", json={})
    print(f"POST /api/chat Status: {r_chat.status_code}")
    
    r_know = requests.get(f"{BASE_URL}/api/knowledge/sources") 
    print(f"GET /api/knowledge/sources Status: {r_know.status_code}")

    print("\n7. Verifying DB records and Foreign Keys...")
    with engine.connect() as conn:
        # Check leads
        res = conn.execute(text("SELECT id, customer_name FROM leads WHERE id = :lid"), {"lid": lead_id}).fetchone()
        print(f"DB Lead Found: {res}")
        
        # Check calls
        res_calls = conn.execute(text("SELECT id, lead_id FROM calls WHERE lead_id = :lid"), {"lid": lead_id}).fetchall()
        print(f"DB Calls Found: {len(res_calls)} (Lead FK: {res_calls[0][1] if res_calls else 'N/A'})")

        # Check callbacks
        res_cbs = conn.execute(text("SELECT id, lead_id FROM callbacks WHERE lead_id = :lid"), {"lid": lead_id}).fetchall()
        print(f"DB Callbacks Found: {len(res_cbs)} (Lead FK: {res_cbs[0][1] if res_cbs else 'N/A'})")

if __name__ == "__main__":
    test_live()
