import unittest
import threading
import time
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock config before importing ChatService
with patch.dict(os.environ, {
    'SUPABASE_URL': 'https://example.supabase.co',
    'SUPABASE_KEY': 'test-key',
    'SUPABASE_SERVICE_KEY': 'test-service-key',
    'ZAI_API_KEY': 'test-zai-key'
}):
    from backend.app.services.chat_service import ChatService

class TestConcurrency(unittest.TestCase):
    def setUp(self):
        self.mock_supabase = MagicMock()
        self.mock_llm = MagicMock()
        self.mock_analysis = MagicMock()
        self.mock_safety = MagicMock()
        self.mock_cache = MagicMock()
        
        self.chat_service = ChatService(
            self.mock_supabase,
            self.mock_llm,
            self.mock_analysis,
            self.mock_safety,
            self.mock_cache
        )
        # Mock internal methods to avoid actual DB calls
        self.chat_service._summarize_and_save_memories = MagicMock()
        self.chat_service._generate_automated_journal = MagicMock()
        self.chat_service.get_current_user_id = MagicMock(return_value="test_user")

    def test_single_timer_scheduling(self):
        """Test that rapid calls only result in one active timer."""
        
        # Simulate 10 rapid messages
        for i in range(10):
            self.chat_service._check_conversation_activity()
            
        # Check that we have a timer
        self.assertIsNotNone(self.chat_service._extraction_timer)
        self.assertTrue(self.chat_service._extraction_timer.is_alive())
        
    @patch('threading.Timer')
    def test_timer_cancellation(self, mock_timer_cls):
        """Verify that previous timers are cancelled."""
        mock_timer_instance = MagicMock()
        mock_timer_cls.return_value = mock_timer_instance
        
        # First call
        self.chat_service._check_conversation_activity()
        
        # Second call
        self.chat_service._check_conversation_activity()
        
        # Since we mock the class, every instantiation returns the SAME mock object by default unless side_effect is used.
        # Let's use side_effect to return distinct mocks.
        timer1 = MagicMock()
        timer2 = MagicMock()
        mock_timer_cls.side_effect = [timer1, timer2]
        
        # Reset and try again
        self.chat_service._extraction_timer = None
        
        # Call 1
        self.chat_service._check_conversation_activity()
        self.assertEqual(self.chat_service._extraction_timer, timer1)
        timer1.start.assert_called_once()
        
        # Call 2
        self.chat_service._check_conversation_activity()
        timer1.cancel.assert_called_once() # Crucial check
        self.assertEqual(self.chat_service._extraction_timer, timer2)
        timer2.start.assert_called_once()

if __name__ == '__main__':
    unittest.main()
