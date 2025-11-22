import sys
import os
import threading
import time
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())
load_dotenv()

from app import create_app

def test_user_memory_isolation():
    print("--- Starting Memory Isolation Verification ---")
    
    app = create_app()
    chat_service = app.chat_service
    
    # User A and User B IDs
    user_a_id = "user_a_isolation_test"
    user_b_id = "user_b_isolation_test"
    
    results = {"user_a_success": False, "user_b_success": False}
    
    def user_a_task():
        try:
            print(f"👤 User A: Setting context to {user_a_id}")
            chat_service.set_user_context(user_a_id)
            
            # Verify context is set correctly
            current = chat_service.get_current_user_id()
            if current != user_a_id:
                print(f"❌ User A: Context mismatch! Got {current}")
                return
                
            # Save a memory for User A
            print("👤 User A: Saving memory 'favorite_color' = 'blue'")
            chat_service._save_memory_tool("favorite_color", "blue")
            
            # Sleep to allow potential race condition if not thread safe
            time.sleep(1)
            
            # Check memory
            memories = chat_service._get_all_memories()
            has_memory = any(m['key'] == 'favorite_color' and m['value'] == 'blue' for m in memories)
            
            if has_memory:
                print("✅ User A: Successfully retrieved own memory")
                results["user_a_success"] = True
            else:
                print("❌ User A: Failed to retrieve own memory")
                
        except Exception as e:
            print(f"❌ User A Error: {e}")

    def user_b_task():
        try:
            print(f"👤 User B: Setting context to {user_b_id}")
            chat_service.set_user_context(user_b_id)
            
            # Verify context is set correctly
            current = chat_service.get_current_user_id()
            if current != user_b_id:
                print(f"❌ User B: Context mismatch! Got {current}")
                return
            
            # Sleep to allow User A to save memory
            time.sleep(0.5)
            
            # Check memory - SHOULD NOT HAVE User A's memory
            memories = chat_service._get_all_memories()
            has_user_a_memory = any(m['key'] == 'favorite_color' and m['value'] == 'blue' for m in memories)
            
            if not has_user_a_memory:
                print("✅ User B: Correctly does NOT see User A's memory")
                results["user_b_success"] = True
            else:
                print("❌ User B: INCORRECTLY saw User A's memory! Isolation failed!")
                
        except Exception as e:
            print(f"❌ User B Error: {e}")

    # Run tasks in parallel threads
    t1 = threading.Thread(target=user_a_task)
    t2 = threading.Thread(target=user_b_task)
    
    t1.start()
    t2.start()
    
    t1.join()
    t2.join()
    
    if results["user_a_success"] and results["user_b_success"]:
        print("\n🎉 VERIFICATION SUCCESSFUL: Memories are isolated per user!")
    else:
        print("\n❌ VERIFICATION FAILED: Isolation check failed.")

if __name__ == "__main__":
    test_user_memory_isolation()
