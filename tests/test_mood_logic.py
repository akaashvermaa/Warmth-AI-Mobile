import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Mock supabase module BEFORE importing backend
mock_supabase = MagicMock()
sys.modules['supabase'] = mock_supabase

# Set dummy env vars
os.environ['ZAI_API_KEY'] = 'dummy_key'
os.environ['SUPABASE_URL'] = 'https://example.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'dummy_key'

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.chat_service import ChatService

class TestMoodLogic(unittest.TestCase):
    def setUp(self):
        self.mock_supabase = MagicMock()
        self.mock_llm = MagicMock()
        self.mock_analyzer = MagicMock()
        self.mock_safety = MagicMock()
        self.mock_cache = MagicMock()
        
        self.chat_service = ChatService(
            self.mock_supabase,
            self.mock_llm,
            self.mock_analyzer,
            self.mock_safety,
            self.mock_cache
        )
        self.chat_service.set_user_context('test_user')

    def test_mood_aggregation_skip(self):
        # Mock last log < 3 hours ago
        last_time = datetime.utcnow() - timedelta(hours=1)
        self.mock_supabase.table().select().eq().order().limit().execute.return_value.data = [{
            'score': 0.5,
            'timestamp': last_time.isoformat() + 'Z'
        }]
        
        # Mock analysis result (same score)
        self.mock_analyzer.analyze_message.return_value = {
            'sentiment_score': 0.5,
            'topics': ['General']
        }
        
        result = self.chat_service._auto_analyze_and_log_mood("test message")
        
        # Should skip logging (return skipped dict)
        self.assertEqual(result['label'], 'Skipped')
        self.mock_supabase.table().insert.assert_not_called()

    def test_mood_aggregation_force_log(self):
        # Mock last log < 3 hours ago
        last_time = datetime.utcnow() - timedelta(hours=1)
        self.mock_supabase.table().select().eq().order().limit().execute.return_value.data = [{
            'score': 0.5,
            'timestamp': last_time.isoformat() + 'Z'
        }]
        
        # Mock analysis result (significant change)
        self.mock_analyzer.analyze_message.return_value = {
            'sentiment_score': -0.5, # Change of 1.0
            'topics': ['Stress']
        }
        
        result = self.chat_service._auto_analyze_and_log_mood("stressful message")
        
        # Should log
        self.assertNotEqual(result['label'], 'Skipped')
        self.mock_supabase.table().insert.assert_called()

    def test_memory_limit_reached(self):
        # Mock memory count >= 3
        self.mock_supabase.table().select().eq().gte().execute.return_value.count = 3
        
        result = self.chat_service._enhanced_auto_memory_extraction("I live in Paris")
        
        self.assertEqual(result['status'], 'skipped')
        self.assertEqual(result['reason'], 'daily_limit_reached')

if __name__ == '__main__':
    unittest.main()
