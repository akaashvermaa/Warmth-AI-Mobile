
import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import re

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.chat_service import ChatService

class TestMemoryExtraction(unittest.TestCase):
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
        
        # Mock user context
        self.chat_service.set_user_context("test_user_id")

    def test_regex_matching(self):
        """Test if the user input triggers the memory extraction regex"""
        user_input = "you know my favourite is my pet dog skyee"
        
        # Copy regex from chat_service.py
        memory_rich_patterns = [
            r"i am (\w+)",
            r"i'm (\w+)",
            r"my name is (\w+)",
            r"i work as (?:a |an )?([^,.!?]+)",
            r"i live (?:in|at) ([^.!?]+)",
            r"i have (?:a |an )?([^,.!?]+)",
            r"my (\w+) is ([^.!?]+)",
            r"i like (?:to )?([^,.!?]+)",
            r"i don't like (?:to )?([^,.!?]+)",
            r"i (?:go to|study at) ([^.!?]+)",
            r"i graduated (?:from )?([^,.!?]+)",
            r"i was born (?:in|at) ([^.!?]+)",
            r"i'm from ([^.!?]+)",
            r"my favorite ([^.!?]+)",
            r"i'm feeling ([^.!?]+)"
        ]
        
        matched = False
        for pattern in memory_rich_patterns:
            if re.search(pattern, user_input.lower()):
                print(f"Matched pattern: {pattern}")
                matched = True
                break
        
        self.assertTrue(matched, "User input did not match any memory rich patterns")

    def test_should_extract_memories_now(self):
        """Test the actual method in ChatService"""
        user_input = "you know my favourite is my pet dog skyee"
        should_extract = self.chat_service._should_extract_memories_now(user_input)
        self.assertTrue(should_extract, "_should_extract_memories_now returned False")

    def test_enhanced_auto_memory_extraction(self):
        """Test the extraction logic with a mocked LLM response"""
        user_input = "you know my favourite is my pet dog skyee"
        
        # Mock LLM response with markdown code blocks (common LLM behavior)
        self.mock_llm.chat.return_value = {
            'message': {
                'content': '```json\n{"tool_call": "save_memory", "args": {"key": "Favorite", "value": "pet dog Skyee"}}\n```'
            }
        }
        
        # Mock get_all_memories to return empty list (no duplicates)
        self.chat_service._get_all_memories = MagicMock(return_value=[])
        
        # Mock save_memory_tool
        self.chat_service._save_memory_tool = MagicMock()
        
        result = self.chat_service._enhanced_auto_memory_extraction(user_input)
        
        print(f"Extraction result: {result}")
        
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(result['memories_saved'], 1)
        self.chat_service._save_memory_tool.assert_called_with("Favorite", "pet dog Skyee")

if __name__ == '__main__':
    unittest.main()
