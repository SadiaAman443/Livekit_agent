from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

def run_tests():
    print("Testing Lead Creation...")
    lead_resp = client.post("/api/leads", json={
        "customer_name": "Test User",
        "phone_number": "1234567890",
        "project_name": "Test Project"
    })
    print(f"Lead Create Status: {lead_resp.status_code}")
    print(f"Lead Create Response: {json.dumps(lead_resp.json(), indent=2)}")
    
    if lead_resp.status_code != 200:
        print("Failed to create lead.")
        return
        
    lead_id = lead_resp.json()["id"]
    
    print("\nTesting Call Creation...")
    call_resp = client.post("/api/calls", json={
        "lead_id": lead_id,
        "summary": "This is a test call",
        "duration_seconds": 120
    })
    print(f"Call Create Status: {call_resp.status_code}")
    print(f"Call Create Response: {json.dumps(call_resp.json(), indent=2)}")
    
    print("\nTesting Callback Creation...")
    callback_resp = client.post("/api/callbacks", json={
        "lead_id": lead_id,
        "callback_requested": True,
        "callback_date": "2026-08-15",
        "callback_time": "10:00 AM",
        "reason": "Customer busy"
    })
    print(f"Callback Create Status: {callback_resp.status_code}")
    print(f"Callback Create Response: {json.dumps(callback_resp.json(), indent=2)}")
    
    print("\nTesting 404 for invalid lead_id in Call Creation...")
    invalid_call_resp = client.post("/api/calls", json={
        "lead_id": "00000000-0000-0000-0000-000000000000",
        "summary": "Should fail"
    })
    print(f"Invalid Call Status: {invalid_call_resp.status_code}")
    print(f"Invalid Call Response: {json.dumps(invalid_call_resp.json(), indent=2)}")

if __name__ == "__main__":
    run_tests()
