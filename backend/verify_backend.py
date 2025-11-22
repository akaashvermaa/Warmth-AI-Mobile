import requests
import time
import sys
import json

BASE_URL = "http://127.0.0.1:5001"

def log(msg, success=None):
    if success is True:
        print(f"✅ {msg}")
    elif success is False:
        print(f"❌ {msg}")
    else:
        print(f"ℹ️ {msg}")

def wait_for_server():
    log("Waiting for server to start...")
    for _ in range(10):
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                log("Server is up!", True)
                return True
        except requests.ConnectionError:
            pass
        time.sleep(2)
    log("Server failed to start.", False)
    return False

def test_endpoints():
    # 1. Create Dev User (Auth)
    log("Testing Auth (Create Dev User)...")
    try:
        auth_response = requests.post(f"{BASE_URL}/auth/dev-user", json={
            "user_id": "test_user_123",
            "display_name": "Test User"
        })
        if auth_response.status_code in [200, 201]:
            token = auth_response.json().get("access_token")
            log("Auth successful", True)
        else:
            log(f"Auth failed: {auth_response.text}", False)
            return
    except Exception as e:
        log(f"Auth error: {e}", False)
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Chat
    log("Testing Chat...")
    try:
        chat_response = requests.post(f"{BASE_URL}/chat", json={
            "message": "I've been feeling really stressed about work lately.",
            "user_id": "test_user_123"
        }, headers=headers)
        
        if chat_response.status_code == 200:
            data = chat_response.json()
            if "reply" in data:
                log("Chat successful", True)
                # Check for emotions
                if "emotions" in data:
                    log(f"Emotions detected: {data['emotions']}", True)
                else:
                    log("No emotions returned (might be fallback)", None)
            else:
                log("Chat response missing reply", False)
        else:
            log(f"Chat failed: {chat_response.text}", False)
    except Exception as e:
        log(f"Chat error: {e}", False)

    # 3. Test Memory Graph
    log("Testing Memory Graph...")
    try:
        mem_response = requests.get(f"{BASE_URL}/insights/memory-graph", headers=headers)
        if mem_response.status_code == 200:
            log("Memory Graph endpoint accessible", True)
            data = mem_response.json()
            log(f"Memory Graph Data: {json.dumps(data)[:100]}...", True)
        else:
            log(f"Memory Graph failed: {mem_response.text}", False)
    except Exception as e:
        log(f"Memory Graph error: {e}", False)

    # 4. Test Recap Check
    log("Testing Recap Check...")
    try:
        recap_response = requests.get(f"{BASE_URL}/insights/recap/check", headers=headers)
        if recap_response.status_code == 200:
            log("Recap Check successful", True)
        else:
            log(f"Recap Check failed: {recap_response.text}", False)
    except Exception as e:
        log(f"Recap Check error: {e}", False)

if __name__ == "__main__":
    if wait_for_server():
        test_endpoints()
    else:
        sys.exit(1)
