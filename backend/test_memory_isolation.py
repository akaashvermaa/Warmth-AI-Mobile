import sys
import os
import logging
from unittest.mock import MagicMock, patch
from datetime import datetime

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock config
with patch.dict(os.environ, {'ZAI_API_KEY': 'test', 'SUPABASE_URL': 'https://test.supabase.co', 'SUPABASE_KEY': 'test'}):
    from app.services.chat_service import ChatService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockSupabaseTable:
    def __init__(self, data_store, table_name):
        self.store = data_store
        self.table_name = table_name
        self.query_filters = {}

    def insert(self, data):
        if self.table_name not in self.store:
            self.store[self.table_name] = []
        
        # Simulate returning ID
        if isinstance(data, dict):
            data['id'] = len(self.store[self.table_name]) + 1
            self.store[self.table_name].append(data)
            return MagicMock(data=[data])
        return MagicMock(data=[])

    def select(self, columns):
        return self

    def eq(self, column, value):
        self.query_filters[column] = value
        return self

    def execute(self):
        # Filter data based on eq() calls
        if self.table_name not in self.store:
            return MagicMock(data=[])
        
        results = []
        for row in self.store[self.table_name]:
            match = True
            for col, val in self.query_filters.items():
                if row.get(col) != val:
                    match = False
                    break
            if match:
                results.append(row)
        
        return MagicMock(data=results)
    
    def update(self, data):
        # Simple mock update - just return success if found
        return self.execute() # reusing execute to find rows, in reality update modifies them

class MockSupabaseClient:
    def __init__(self):
        self.data_store = {}

    def table(self, table_name):
        return MockSupabaseTable(self.data_store, table_name)

def test_memory_isolation():
    print("🧪 Testing Memory Isolation...")
    
    # Setup
    mock_supabase = MockSupabaseClient()
    mock_llm = MagicMock()
    mock_analysis = MagicMock()
    mock_safety = MagicMock()
    mock_cache = MagicMock()
    
    chat_service = ChatService(
        supabase_client=mock_supabase,
        llm_service=mock_llm,
        analysis_service=mock_analysis,
        safety_service=mock_safety,
        cache_manager=mock_cache
    )

    # User IDs
    USER_A = "user-aaa-111"
    USER_B = "user-bbb-222"

    # 1. User A saves a memory
    print(f"\n👤 User A ({USER_A}) saving memory...")
    chat_service.set_user_context(USER_A)
    chat_service._save_memory_tool("pet", "Rex the dog")
    
    # Verify it's in the "DB"
    memories_db = mock_supabase.data_store.get('memories', [])
    print(f"   DB State: {len(memories_db)} memories total")
    assert len(memories_db) == 1
    assert memories_db[0]['user_id'] == USER_A
    assert memories_db[0]['value'] == "Rex the dog"
    print("   ✅ Memory saved correctly for User A")

    # 2. User B tries to read memories
    print(f"\n👤 User B ({USER_B}) checking memories...")
    chat_service.set_user_context(USER_B)
    memories_b = chat_service._get_all_memories()
    
    print(f"   User B found: {len(memories_b)} memories")
    assert len(memories_b) == 0
    print("   ✅ User B sees 0 memories (Correct Isolation)")

    # 3. User A checks memories
    print(f"\n👤 User A ({USER_A}) checking memories...")
    chat_service.set_user_context(USER_A)
    memories_a = chat_service._get_all_memories()
    
    print(f"   User A found: {len(memories_a)} memories")
    assert len(memories_a) == 1
    assert memories_a[0]['value'] == "Rex the dog"
    print("   ✅ User A sees their memory")

    # 4. User B saves their own memory
    print(f"\n👤 User B ({USER_B}) saving memory...")
    chat_service.set_user_context(USER_B)
    chat_service._save_memory_tool("pet", "Luna the cat")
    
    # 5. Verify Isolation again
    print("\n🔒 Verifying final isolation...")
    
    # User A should still only see Rex
    chat_service.set_user_context(USER_A)
    memories_a_final = chat_service._get_all_memories()
    assert len(memories_a_final) == 1
    assert memories_a_final[0]['value'] == "Rex the dog"
    print("   ✅ User A still only sees Rex")

    # User B should only see Luna
    chat_service.set_user_context(USER_B)
    memories_b_final = chat_service._get_all_memories()
    assert len(memories_b_final) == 1
    assert memories_b_final[0]['value'] == "Luna the cat"
    print("   ✅ User B only sees Luna")

    print("\n🎉 All isolation tests passed!")

if __name__ == "__main__":
    test_memory_isolation()
