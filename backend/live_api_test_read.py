import requests
import json
from uuid import uuid4

BASE_URL = "http://localhost:8000"

def test_read_update():
    print("1. Testing GET /api/leads...")
    r_leads = requests.get(f"{BASE_URL}/api/leads")
    print(f"GET Leads Status: {r_leads.status_code}")
    leads = r_leads.json()
    if not leads:
        print("No leads found to test.")
        return
    lead = leads[0]
    lead_id = lead['id']
    print(f"Found Lead ID: {lead_id}, Status: {lead['status']}")
    
    print("\n2. Testing GET /api/leads/{lead_id}...")
    r_lead = requests.get(f"{BASE_URL}/api/leads/{lead_id}")
    print(f"GET Lead Status: {r_lead.status_code}")
    print(f"GET Lead Response: {json.dumps(r_lead.json())[:200]}")
    
    print("\n3. Testing GET /api/leads/{lead_id}/calls...")
    r_calls = requests.get(f"{BASE_URL}/api/leads/{lead_id}/calls")
    print(f"GET Calls Status: {r_calls.status_code}")
    print(f"GET Calls Response: {json.dumps(r_calls.json())[:200]}")
    
    print("\n4. Testing GET /api/leads/{lead_id}/callbacks...")
    r_callbacks = requests.get(f"{BASE_URL}/api/leads/{lead_id}/callbacks")
    print(f"GET Callbacks Status: {r_callbacks.status_code}")
    callbacks = r_callbacks.json()
    print(f"GET Callbacks Response: {json.dumps(callbacks)[:200]}")
    
    print("\n5. Testing PATCH /api/leads/{lead_id}...")
    r_patch_lead = requests.patch(f"{BASE_URL}/api/leads/{lead_id}", json={"status": "CONTACTED"})
    print(f"PATCH Lead Status: {r_patch_lead.status_code}")
    print(f"PATCH Lead Response: {json.dumps(r_patch_lead.json())[:200]}")

    if callbacks:
        callback_id = callbacks[0]['id']
        print(f"\n6. Testing PATCH /api/callbacks/{callback_id}...")
        r_patch_cb = requests.patch(f"{BASE_URL}/api/callbacks/{callback_id}", json={"status": "COMPLETED"})
        print(f"PATCH Callback Status: {r_patch_cb.status_code}")
        print(f"PATCH Callback Response: {json.dumps(r_patch_cb.json())[:200]}")

    print("\n7. Verifying RAG functionality routes... (/api/chat)")
    r_chat = requests.post(f"{BASE_URL}/api/chat", json={})
    print(f"POST /api/chat Status: {r_chat.status_code}")

if __name__ == "__main__":
    test_read_update()
