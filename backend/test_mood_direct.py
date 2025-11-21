#!/usr/bin/env python3
"""Direct test of mood history functionality"""

import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from app.services.chat_service import ChatService
from app.services.llm_service import LLMService
from app.services.analysis_service import MoodAnalyzer
from app.services.safety_service import SafetyNet
from app.services.cache_service import CacheManager
from app.config import DEFAULT_USER_ID
from supabase import create_client
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_mood_history():
    try:
        # Initialize services
        supabase = create_client(
            "https://kvdrnoctdtqzwdcsjcvy.supabase.co",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHJub2N0ZHRxendkY3NqY3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyNzc0MCwiZXhwIjoyMDc4ODAzNzQwfQ.UV7E-0E5CpCAfRX2gIZPLVB3fxBFjdmDE7RXrhOmucY"
        )

        llm_service = LLMService()
        mood_analyzer = MoodAnalyzer()
        safety_service = SafetyNet()
        cache_manager = CacheManager()

        # Create ChatService
        chat_service = ChatService(
            supabase_client=supabase,
            llm_service=llm_service,
            analysis_service=mood_analyzer,
            safety_service=safety_service,
            cache_manager=cache_manager
        )

        # Set user context
        chat_service.set_user_context(DEFAULT_USER_ID)

        # Test mood history
        print("Getting mood history...")
        history = chat_service.get_mood_history()
        print(f"Mood history: {history}")

        # Test mood logging
        print("\nLogging a test mood...")
        chat_service._log_mood(0.5, "positive", "test")
        print("Mood logged successfully")

        # Get history again
        print("\nGetting updated mood history...")
        history = chat_service.get_mood_history()
        print(f"Updated mood history: {history}")

        return True

    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = test_mood_history()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")