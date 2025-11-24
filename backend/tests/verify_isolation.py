import requests
import json
import sys
import time

BASE_URL = "http://localhost:5001"

def create_dev_user(user_id, display_name):
    """Creates a dev user and returns the token."""
    print(f"Creating dev user: {user_id}...")
    response = requests.post(f"{BASE_URL}/auth/dev-user", json={
        "user_id": user_id,
        "display_name": display_name
    })
    if response.status_code != 201:
        print(f"Failed to create user {user_id}: {response.text}")
        sys.exit(1)
    return response.json()

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_isolation():
    print("=== Starting Data Isolation Verification ===")

    # 1. Create two users
    user_a = create_dev_user("user_a_isolation", "User A")
    user_b = create_dev_user("user_b_isolation", "User B")

    token_a = user_a["access_token"]
    token_b = user_b["access_token"]
    
    print(f"User A ID: {user_a['user_id']}")
    print(f"User B ID: {user_b['user_id']}")

    # 2. User A creates data
    print("\n--- User A Creating Data ---")
    
    # A. Log Mood
    print("User A logging mood...")
    requests.post(f"{BASE_URL}/mood", headers=get_headers(token_a), json={
        "score": 0.8,
        "label": "happy",
        "topic": "testing"
    })

    # B. Send Chat Message
    print("User A sending message...")
    requests.post(f"{BASE_URL}/chat", headers=get_headers(token_a), json={
        "message": "Secret message from User A",
        "user_id": user_a["user_id"]
    })
    
    # Wait a moment for async processing
    time.sleep(1)

    # 3. User B tries to see User A's data
    print("\n--- User B Attempting to Access User A's Data ---")
    
    # A. Check Mood History
    print("User B checking mood history...")
    mood_resp = requests.get(f"{BASE_URL}/mood-history", headers=get_headers(token_b))
    moods = mood_resp.json()
    print(f"User B sees {len(moods)} mood logs.")
    
    if len(moods) > 0:
        print("❌ FAILURE: User B can see mood logs! Isolation broken.")
        sys.exit(1)
    else:
        print("✅ SUCCESS: User B sees 0 mood logs.")

    # B. Check Chat History
    print("User B checking chat history...")
    chat_resp = requests.get(f"{BASE_URL}/chat/history", headers=get_headers(token_b))
    chats = chat_resp.json()
    print(f"User B sees {len(chats)} chat messages.")
    
    if len(chats) > 0:
        print("❌ FAILURE: User B can see chat messages! Isolation broken.")
        sys.exit(1)
    else:
        print("✅ SUCCESS: User B sees 0 chat messages.")

    # 4. User B creates their own data
    print("\n--- User B Creating Own Data ---")
    print("User B logging mood...")
    requests.post(f"{BASE_URL}/mood", headers=get_headers(token_b), json={
        "score": -0.5,
        "label": "sad",
        "topic": "isolation_test"
    })
    
    # 5. Verify User B sees their own data
    print("\n--- Verifying User B Data ---")
    mood_resp = requests.get(f"{BASE_URL}/mood-history", headers=get_headers(token_b))
    moods = mood_resp.json()
    print(f"User B sees {len(moods)} mood logs.")
    
    if len(moods) == 1:
        print("✅ SUCCESS: User B sees exactly 1 mood log (their own).")
    else:
        print(f"❌ FAILURE: User B sees {len(moods)} logs (expected 1).")
        sys.exit(1)

    print("\n=== VERIFICATION COMPLETE: DATA ISOLATION CONFIRMED ===")

if __name__ == "__main__":
    try:
        test_isolation()
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
