# app/__init__.py
import os
import logging
import threading
import time
from flask import Flask, jsonify
from flask_cors import CORS

# --- Core App Imports ---
from . import config

# --- Service Layer Imports ---
from .services.llm_service import LLMService
from .services.analysis_service import MoodAnalyzer
from .services.safety_service import SafetyNet
from .services.embedding_service import EmbeddingManager
from .services.cache_service import CacheManager
from .services.chat_service import ChatService

# --- Storage Layer Import ---
from supabase import create_client, Client

# --- Web Blueprint Imports ---
from .web import main, auth, errors, memory, mood, preferences  # Supabase auth

# --- Initialize Extensions ---
cors = CORS()

# --- Service Instantiation ---
logger = logging.getLogger(__name__)

try:
    # Initialize Supabase client
    supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

    # Initialize services
    llm_service = LLMService()
    analysis_service = MoodAnalyzer()
    safety_service = SafetyNet()
    cache_manager = CacheManager()

    chat_service = ChatService(
        supabase_client=supabase,  # Changed from memory_repo to supabase_client
        llm_service=llm_service,
        analysis_service=analysis_service,
        safety_service=safety_service,
        cache_manager=cache_manager
    )

except Exception as e:
    logger.critical(f"CRITICAL: Failed to initialize core services: {e}", exc_info=True)
    raise

def create_app():
    """
    Application Factory: Creates and configures the Flask app.
    """
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # === THE FIX IS HERE ===
    # We remove all arguments. Flask's default is to look for 'static' and 'templates'
    # in the SAME directory as this __init__.py file, which is correct for your structure.
    app = Flask(__name__)
    
    # === Load Config ===
    app.config.from_object(config)
    
    # Set secret key for sessions
    app.secret_key = app.config.get('FLASK_SECRET_KEY', os.urandom(32).hex())

    # === Initialize Extensions ===
    cors.init_app(app, origins=app.config.get('ALLOWED_ORIGINS', '*').split(','), supports_credentials=True)

    # === Register Blueprints (Web Routes) ===
    app.register_blueprint(errors.bp)
    app.register_blueprint(main.bp)
    app.register_blueprint(auth.bp)  # Supabase Auth endpoints
    app.register_blueprint(memory.bp)
    app.register_blueprint(mood.bp)
    app.register_blueprint(preferences.bp)
    
    # === Inject Services onto the App Object ===
    app.chat_service = chat_service
    app.supabase = supabase  # Changed from app.memory_repo to app.supabase

    # === Background Tasks ===
    schedule_proactive_checkins(app, chat_service)

    return app

# --- Background Task (Helper) ---

# --- Proactive Check-in System ---
def schedule_proactive_checkins(app, chat_service: ChatService):
    """
    Schedules proactive check-ins when negative mood trends are detected.
    """

    def _checkin_loop():
        while True:
            try:
                # Check every 4 hours (can be configured)
                time.sleep(14400)  # 4 hours in seconds

                with app.app_context():
                    should_checkin = _should_initiate_checkin(chat_service)
                    if should_checkin:
                        _initiate_proactive_checkin(chat_service, app)

            except Exception as e:
                app.logger.error(f"Proactive check-in task error: {e}")

    checkin_thread = threading.Thread(target=_checkin_loop, daemon=True, name="ProactiveCheckin")
    checkin_thread.start()
    app.logger.info("Proactive check-in task started (check interval: 4 hours)")

def _should_initiate_checkin(chat_service: ChatService) -> bool:
    """
    Determines if a proactive check-in should be initiated.
    """
    try:
        # Check if there's enough mood data
        mood_context = chat_service._get_recent_mood_context()

        # Must have negative trend
        if not mood_context.get('is_negative_trend', False):
            return False

        # Check if conversation is already active
        if _is_conversation_active(chat_service):
            return False

        # Check last check-in time to avoid spam
        if _was_recent_checkin(chat_service):
            return False

        return True

    except Exception as e:
        logger.error(f"Error in proactive check-in logic: {e}")
        return False

def _is_conversation_active(chat_service: ChatService) -> bool:
    """
    Checks if there's an active conversation.
    A conversation is considered active if there are recent messages.
    """
    try:
        # Check if there are messages in the last 2 hours
        user_id = chat_service.get_current_user_id()
        recent_messages = chat_service.get_recent_chat_messages(user_id, hours=2)
        return len(recent_messages) > 0

    except Exception:
        # If we can't determine, assume conversation is active to be safe
        return True

def _was_recent_checkin(chat_service: ChatService) -> bool:
    """
    Checks if there was a recent proactive check-in to avoid spam.
    """
    try:
        # Look for recent bot messages that match our check-in patterns
        user_id = chat_service.get_current_user_id()
        recent_messages = chat_service.get_recent_chat_messages(user_id, hours=24)

        checkin_patterns = [
            "noticed things have been tough",
            "want to chat about what's on your mind",
            "thinking of you",
            "how have you been feeling lately"
        ]

        for message in recent_messages:
            if message.get('role') == 'assistant':
                content = message.get('content', '').lower()
                if any(pattern in content for pattern in checkin_patterns):
                    return True

        return False

    except Exception:
        # If we can't determine, assume there was a recent check-in to be safe
        return True

def _initiate_proactive_checkin(chat_service: ChatService, app):
    """
    Initiates a proactive check-in message.
    """
    try:
        checkin_message = "I've noticed things have been tough lately. Want to chat about what's on your mind?"

        # Log the proactive check-in
        app.logger.info(f"Initiating proactive check-in for user {chat_service.get_current_user_id()}")

        # Add the bot's message to the chat history
        chat_service.history.append({
            "role": "assistant",
            "content": checkin_message
        })

        # Store the message in Supabase for history
        chat_service._add_chat_message("assistant", checkin_message)

        app.logger.info(f"Proactive check-in message sent: {checkin_message}")

    except Exception as e:
        app.logger.error(f"Failed to initiate proactive check-in: {e}")