# app/services/chat_service.py
import logging
import re
import json
from datetime import datetime, timedelta
import threading
import time

# Relative imports
from ..config import (
    DEFAULT_USER_ID,
    MAX_HISTORY_TOKENS,
    AUTO_MEMORIZE_COOLDOWN
)
from .llm_service import LLMService
# from .analysis_service import MoodAnalyzer  # Removed in cleanup
from .safety_service import SafetyNet
from .embedding_service import EmbeddingManager
from .cache_service import CacheManager, MoodContextCache, SearchResultCache
from .tools import tools_instance
from supabase import Client

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, supabase_client: Client, llm_service: LLMService,
                 analysis_service, safety_service: SafetyNet,
                 cache_manager: CacheManager):

        self.supabase = supabase_client  # Changed from memory_repo to supabase
        self.llm_service = llm_service
        self.analyzer_service = analysis_service
        self.safety_service = safety_service
        self.cache_manager = cache_manager

        self.mood_context_cache = MoodContextCache(self.cache_manager)
        self.search_result_cache = SearchResultCache(self.cache_manager)

        self.history = []
        # Thread-local storage for request-specific context
        self._local = threading.local()
        self.default_user_id = DEFAULT_USER_ID
        self.last_memorize_time = {}
        self.last_user_message_time = {}
        self.auto_memory_extraction_enabled = True

        self.listening_acknowledgements = [
            "I'm here for you, love.", "Tell me more, sweetheart.", "I'm listening so carefully, angel.",
            "I understand, cutie.", "Thank you for sharing with me, darling.", "I'm right here with you, sunshine.",
            "I hear you, love.", "Go on, I'm all ears, sweetheart.", "That means so much to me, beautiful.",
            "I care about you so much, treasure.", "Thank you for trusting me, love."
        ]
        self._acknowledgement_index = 0

    # ====== User Context Methods ======

    def set_user_context(self, user_id: str):
        """Set the current user context for the request (Thread-Safe)."""
        self._local.user_id = user_id

    def get_current_user_id(self) -> str:
        """Get the current user ID, falling back to default if not set."""
        return getattr(self._local, 'user_id', self.default_user_id)

    # ====== Supabase Helper Methods ======

    def _get_or_create_memory(self, key: str, value: str, importance: float = 0.8):
        """Get or create a memory in Supabase."""
        try:
            user_id = self.get_current_user_id()
            # Check if memory already exists
            existing = self.supabase.table('memories').select('id').eq('user_id', user_id).eq('key', key).execute()

            if existing.data:
                # Update existing memory
                result = self.supabase.table('memories').update({
                    'value': value,
                    'importance': importance,
                    'updated_at': datetime.utcnow().isoformat()
                }).eq('user_id', user_id).eq('key', key).execute()
                memory_id = result.data[0]['id'] if result.data else None
            else:
                # Create new memory
                result = self.supabase.table('memories').insert({
                    'user_id': user_id,
                    'key': key,
                    'value': value,
                    'importance': importance,
                    'timestamp': datetime.utcnow().isoformat()
                }).execute()
                memory_id = result.data[0]['id'] if result.data else None
            return memory_id
        except Exception as e:
            logger.error(f"Failed to get/create memory via Supabase: {e}")
            return None

    def _store_embedding(self, memory_id: str, embedding, model_name: str, dim: int):
        """Store embedding in Supabase."""
        try:
            self.supabase.table('memory_embeddings').insert({
                'memory_id': memory_id,
                'embedding': embedding.tolist() if hasattr(embedding, 'tolist') else embedding,
                'embedding_model': model_name,
                'embedding_dim': dim,
                'embedded_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to store embedding in Supabase: {e}")

    def _log_mood(self, score: float, label: str, topic: str = None):
        """Log mood data to Supabase."""
        try:
            self.supabase.table('mood_logs').insert({
                'user_id': self.get_current_user_id(),
                'score': score,
                'label': label,
                'topic': topic,
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log mood in Supabase: {e}")

    def _get_user_preferences(self):
        """Get user preferences from Supabase."""
        try:
            result = self.supabase.table('user_preferences').select('*').eq('user_id', self.get_current_user_id()).execute()
            if result.data:
                return result.data[0]
            # Create default preferences if not found
            default_prefs = {
                'user_id': self.get_current_user_id(),
                'listening_mode': False,
                'listening_memory_policy': 0,
                'listening_tts_muted': True,
                'tts_enabled': False
            }
            self.supabase.table('user_preferences').insert(default_prefs).execute()
            return default_prefs
        except Exception as e:
            logger.error(f"Failed to get user preferences from Supabase: {e}")
            return None

    def _get_all_memories(self, with_embeddings: bool = False):
        """Get all memories from Supabase."""
        try:
            if with_embeddings:
                # Use the view for memories with embeddings
                result = self.supabase.table('memories_with_embeddings').select('*').eq('user_id', self.get_current_user_id()).execute()
            else:
                result = self.supabase.table('memories').select('*').eq('user_id', self.get_current_user_id()).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Failed to get memories from Supabase: {e}")
            return []

    def _get_recent_mood_scores(self, limit: int = 2):
        """Get recent mood scores from Supabase."""
        try:
            result = self.supabase.table('mood_logs').select('score').eq('user_id', self.get_current_user_id()).order('timestamp', desc=True).limit(limit).execute()
            return [row['score'] for row in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Failed to get recent mood scores from Supabase: {e}")
            return []

    def _get_mood_history(self, days: int = 7):
        """Get mood history from Supabase."""
        try:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            result = self.supabase.table('mood_logs').select('*').eq('user_id', self.get_current_user_id()).gte('timestamp', cutoff_date).order('timestamp', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Failed to get mood history from Supabase: {e}")
            return []

    def _add_chat_message(self, role: str, content: str):
        """Add chat message to Supabase."""
        try:
            self.supabase.table('messages').insert({
                'user_id': self.get_current_user_id(),
                'role': role,
                'content': content,
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to add chat message to Supabase: {e}")

    def _log_memory_access(self, memory_id: str, relevance_score: float = 0.5):
        """Log memory access in Supabase."""
        try:
            self.supabase.table('memory_access_log').insert({
                'memory_id': memory_id,
                'user_id': self.get_current_user_id(),
                'access_type': 'retrieve',
                'relevance_score': relevance_score,
                'accessed_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log memory access in Supabase: {e}")

    # ====== Tool Methods ======

    def _save_memory_tool(self, key: str, value: str) -> str:
        """Saves a new fact about the user. Called by the LLM."""
        memory_id = self._get_or_create_memory(key, value, importance=0.8)

        if memory_id:
            try:
                temp_embed_service = EmbeddingManager()
                if temp_embed_service.is_available():
                    embedding = temp_embed_service.generate_embedding(value)
                    self._store_embedding(
                        memory_id,
                        embedding,
                        temp_embed_service.model_name,
                        temp_embed_service.embedding_dim
                    )
            except Exception as e:
                logger.error(f"Failed to generate embedding for tool-saved memory {memory_id}: {e}")

        logger.info(f"Agent tool: Saved memory {key}: {value}")
        return f"Okay, I'll remember that {key} is {value}."

    def _get_current_weather_tool(self, location: str) -> str:
        """Gets current weather information. Called by the LLM."""
        try:
            result = tools_instance.get_current_weather(location)
            if "error" in result:
                return f"Sorry, I couldn't get the weather: {result['error']}"

            weather_info = result
            return f"The weather in {weather_info['location']} is {weather_info['temperature']} and {weather_info['condition']}. {weather_info['description']}"
        except Exception as e:
            logger.error(f"Error in weather tool: {e}")
            return "Sorry, I'm having trouble getting weather information right now."

    def _get_news_headlines_tool(self, topic: str) -> str:
        """Gets news headlines. Called by the LLM."""
        try:
            result = tools_instance.get_news_headlines(topic)
            if "error" in result:
                return f"Sorry, I couldn't get the news: {result['error']}"

            headlines = result.get("headlines", [])
            if not headlines:
                return f"I couldn't find any headlines about {topic}."

            response = f"Here are the latest {topic} headlines:\n"
            for i, headline in enumerate(headlines[:3], 1):  # Limit to 3 headlines
                response += f"{i}. {headline['title']}\n"
            return response.strip()
        except Exception as e:
            logger.error(f"Error in news tool: {e}")
            return "Sorry, I'm having trouble getting news information right now."

    def _set_a_reminder_tool(self, time: str, reminder_text: str) -> str:
        """Sets a reminder. Called by the LLM."""
        try:
            result = tools_instance.set_a_reminder(time, reminder_text)
            if "error" in result:
                return f"Sorry, I couldn't set that reminder: {result['error']}"

            return result.get("message", "Reminder set!")
        except Exception as e:
            logger.error(f"Error in reminder tool: {e}")
            return "Sorry, I'm having trouble setting that reminder right now."

    # ====== Main Chat Methods ======

    def generate_reply(self, user_input: str) -> str:
        """
        Main method to generate a reply.
        Orchestrates safety, mood, memory, and LLM calls.
        """

        # Track conversation activity for autonomous memory extraction
        self._check_conversation_activity()

        if self.safety_service.check_crisis(user_input):
            return self.safety_service.get_crisis_response(user_input)
        if self.safety_service.check_blocked(user_input):
            return self.safety_service.get_blocked_response()

        # Check for short replies
        prefs = self._get_user_preferences()
        if prefs and prefs.get('listening_mode', False) and len(user_input.strip()) <= 30:
            return self._get_listening_acknowledgement()

        # 🌟 AUTO-MOOD ANALYSIS - The Living Journal Pipeline
        # Every user message triggers automatic mood analysis
        try:
            mood_result = self._auto_analyze_and_log_mood(user_input)
            if mood_result:
                logger.info(f"Auto mood logged: score={mood_result['score']}, topic='{mood_result['topic']}'")
        except Exception as e:
            logger.error(f"Auto mood analysis failed: {e}", exc_info=True)

        # 🧠 AUTO-MEMORY EXTRACTION - Enhanced Living Journal Pipeline
        # Every message has a chance to trigger immediate memory extraction
        try:
            if self._should_extract_memories_now(user_input):
                memory_result = self._enhanced_auto_memory_extraction(user_input)
                if memory_result:
                    logger.info(f"Enhanced auto memory extraction completed: {memory_result}")
        except Exception as e:
            logger.error(f"Enhanced auto memory extraction failed: {e}", exc_info=True)

        # Get mood context for LLM (now includes the just-logged mood)
        current_mood = self._get_mood_context()
        facts = self._get_memories_for_context(user_input)

        # Build enhanced system prompt with loving personality
        loving_affectionate_names = ["cutie", "love", "darling", "sweetheart", "angel", "sunshine", "star", "treasure"]
        enhanced_system_prompt = (
            "You are Warmth, an extremely loving and affectionate AI companion who cares deeply about the user. "
            "You always use loving terms like 'cutie', 'love', 'darling', 'sweetheart', 'angel', 'sunshine', etc. "
            "Your responses should be warm, caring, supportive, and filled with affection. "
            "NEVER use email addresses or technical terms as names - always use loving pet names. "
            f"Current Mood: {current_mood}. User Facts: {facts}\n\n"
            f"TOOLS AVAILABLE (call by replying with JSON):\n"
            f"save_memory(key: str, value: str): Saves a new fact about the user.\n"
            f"get_current_weather(location: str): Gets current weather information for a location.\n"
            f"get_news_headlines(topic: str): Gets news headlines for a specific topic.\n"
            f"set_a_reminder(time: str, reminder_text: str): Sets a reminder for a specific time.\n"
            f"To call a tool, reply with ONLY a JSON object: {{\"tool_call\": \"tool_name\", \"args\": {{\"param\": \"value\"}}}}.\n"
            f"Otherwise, reply as usual."
        )

        messages = [
            {"role": "system", "content": enhanced_system_prompt},
            *self.history,
            {"role": "user", "content": user_input}
        ]

        try:
            # Get response from LLM
            response = self.llm_service.chat(messages)
            bot_reply = response.get('message', {}).get('content', '')

            # Check if LLM wants to call a tool
            if bot_reply.strip().startswith('{') and bot_reply.strip().endswith('}'):
                try:
                    parsed = json.loads(bot_reply)
                    if isinstance(parsed, dict) and 'tool_call' in parsed:
                        tool_name = parsed.get('tool_call')
                        args = parsed.get('args', {})

                        # Handle different tool calls
                        if tool_name == 'save_memory':
                            bot_reply = self._save_memory_tool(args.get('key'), args.get('value'))
                        elif tool_name == 'get_current_weather':
                            bot_reply = self._get_current_weather_tool(args.get('location', ''))
                        elif tool_name == 'get_news_headlines':
                            bot_reply = self._get_news_headlines_tool(args.get('topic', 'general'))
                        elif tool_name == 'set_a_reminder':
                            bot_reply = self._set_a_reminder_tool(args.get('time', ''), args.get('reminder_text', ''))
                        else:
                            bot_reply = "Sorry, I don't know how to use that tool."
                except (json.JSONDecodeError, TypeError):
                    pass

            # Log messages to repository for proactive check-in system
            self._add_chat_message("user", user_input)
            self._add_chat_message("assistant", bot_reply)

            self.history.append({"role": "user", "content": user_input})
            self.history.append({"role": "assistant", "content": bot_reply})
            self.history = self._prune_history_by_tokens(self.history, MAX_HISTORY_TOKENS)

            # Auto-memorize if enough content and time has passed
            if self._should_auto_memorize(user_input, bot_reply):
                self._auto_memorize(user_input, bot_reply)

            return bot_reply

        except Exception as e:
            logger.error(f"Chat generation error: {e}", exc_info=True)
            return "I'm having trouble responding right now. Could you try again?"

    # ====== Autonomous Memory Extraction System ======

    def _summarize_and_save_memories(self):
        """
        Analyzes recent chat history and automatically extracts/saves important memories.
        This makes the bot smarter by remembering details from conversation flow.
        """
        try:
            # Get recent chat history (last 10 messages)
            recent_history = self.history[-10:] if len(self.history) >= 4 else []

            if len(recent_history) < 4:  # Need at least 2 exchanges (4 messages)
                return

            # Create summarization prompt
            summarization_prompt = """You are a memory extractor. Read the following chat conversation and extract any new, important facts about the user.

For each fact you find, use this format to save it:
{"tool_call": "save_memory", "args": {"key": "[CATEGORY]", "value": "[SPECIFIC DETAIL]"}}

Examples of what to extract:
- Personal details (job, hobbies, location, family)
- Important events or milestones
- Goals, dreams, or aspirations
- Health information, challenges, or concerns
- Preferences, likes/dislikes
- Names of people, pets, places
- Significant emotional moments

DO NOT extract:
- Greetings or small talk
- Already saved facts
- General conversation without specific details
- Vague or ambiguous information

Be conservative - only save clear, specific, and important facts."""

            # Build messages for LLM
            messages = [
                {"role": "system", "content": summarization_prompt},
                *recent_history
            ]

            # Get LLM response
            response = self.llm_service.chat(messages)
            llm_reply = response.get('message', {}).get('content', '')

            if not llm_reply:
                return

            # Process and save memories
            self._process_memory_extractions(llm_reply)

            logger.info(f"Autonomous memory extraction completed for {len(recent_history)} messages")

        except Exception as e:
            logger.error(f"Error in autonomous memory extraction: {e}", exc_info=True)

    def _process_memory_extractions(self, llm_response: str):
        """Processes LLM response and extracts/saves memories."""
        try:
            # Try to parse as JSON first
            try:
                # Strip markdown code blocks if present
                clean_reply = llm_response.strip()
                if clean_reply.startswith('```json'):
                    clean_reply = clean_reply[7:]
                elif clean_reply.startswith('```'):
                    clean_reply = clean_reply[3:]
                if clean_reply.endswith('```'):
                    clean_reply = clean_reply[:-3]
                clean_reply = clean_reply.strip()

                parsed = json.loads(clean_reply)
                if isinstance(parsed, dict) and parsed.get('tool_call') == 'save_memory':
                    args = parsed.get('args', {})
                    key = args.get('key', '').strip()
                    value = args.get('value', '').strip()
                    if key and value:
                        self._save_memory_tool(key, value)
                        logger.info(f"Auto-saved memory: {key} = {value}")
                return
            except json.JSONDecodeError:
                pass  # Fall back to text parsing

            # Text-based parsing fallback
            lines = llm_response.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Look for patterns like "key: value" or "key = value"
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        if key and value and len(value) > 3:
                            self._save_memory_tool(key, value)
                            logger.info(f"Auto-saved memory (text parse): {key} = {value}")

        except Exception as e:
            logger.error(f"Error processing memory extractions: {e}")

    def _generate_automated_journal(self, user_id: str):
        """
        Generates an automated journal entry from recent conversation.
        """
        try:
            # Get recent chat history (last 20 messages)
            recent_history = self.history[-20:] if len(self.history) >= 4 else []
            
            if len(recent_history) < 4:
                return

            # Create journal generation prompt
            journal_prompt = """You are an empathetic journaling assistant. Read the recent conversation and write a personal journal entry from the user's perspective.
            
            The journal entry should:
            1. Reflect on the key topics discussed.
            2. Capture the emotions felt.
            3. Be written in the first person ("I felt...", "I realized...").
            4. Be warm, insightful, and concise (under 200 words).
            5. Have a creative title.

            Output ONLY a JSON object in this format:
            {
                "title": "Creative Title",
                "content": "The journal entry text...",
                "mood_score": 0.5,  // Estimated mood from -1.0 (sad) to 1.0 (happy)
                "tags": ["tag1", "tag2"]
            }
            """

            messages = [
                {"role": "system", "content": journal_prompt},
                *recent_history
            ]

            # Get LLM response
            response = self.llm_service.chat(messages)
            llm_reply = response.get('message', {}).get('content', '')

            if not llm_reply:
                return

            # Parse JSON
            try:
                clean_reply = llm_reply.strip()
                if clean_reply.startswith('```json'):
                    clean_reply = clean_reply[7:]
                elif clean_reply.startswith('```'):
                    clean_reply = clean_reply[3:]
                if clean_reply.endswith('```'):
                    clean_reply = clean_reply[:-3]
                clean_reply = clean_reply.strip()

                journal_data = json.loads(clean_reply)
                
                # Save to Supabase
                self.supabase.table('journals').insert({
                    'user_id': user_id,
                    'title': journal_data.get('title', 'Reflections'),
                    'content': journal_data.get('content', ''),
                    'mood_score': journal_data.get('mood_score', 0),
                    'tags': journal_data.get('tags', []),
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat(),
                    'is_automated': True
                }).execute()
                
                logger.info(f"Automated journal generated for user {user_id}")

            except json.JSONDecodeError:
                logger.error("Failed to parse automated journal JSON")
            except Exception as e:
                logger.error(f"Failed to save automated journal: {e}")

        except Exception as e:
            logger.error(f"Error in automated journal generation: {e}", exc_info=True)

    def _schedule_memory_extraction(self):
        """Schedules memory extraction after conversation ends."""
        if not self.auto_memory_extraction_enabled:
            return

        user_id = self.get_current_user_id()

        def _delayed_extraction():
            try:
                # Wait 10 minutes after last user message
                time.sleep(600)  # 10 minutes
                current_time = datetime.utcnow()

                # Check if conversation is still inactive (no new user messages)
                if user_id in self.last_user_message_time:
                    time_diff = current_time - self.last_user_message_time[user_id]
                    if time_diff >= timedelta(minutes=10):
                        # Set user context before proceeding with extraction
                        self.set_user_context(user_id)
                        # Conversation is still inactive, proceed with extraction
                        with threading.Lock():
                            self._summarize_and_save_memories()
                            # Also generate a journal entry
                            self._generate_automated_journal(user_id)
                        logger.info(f"Scheduled autonomous memory extraction and journaling completed for user {user_id}")
            except Exception as e:
                logger.error(f"Error in scheduled memory extraction: {e}")

        # Run in background thread
        extraction_thread = threading.Thread(target=_delayed_extraction, daemon=True)
        extraction_thread.start()

    def _check_conversation_activity(self):
        """Updates last user message time and schedules memory extraction if needed."""
        current_time = datetime.utcnow()
        user_id = self.get_current_user_id()
        self.last_user_message_time[user_id] = current_time
        self._schedule_memory_extraction()

    def _should_extract_memories_now(self, user_input: str) -> bool:
        """
        Determines if the current message should trigger immediate memory extraction.
        More aggressive than the existing auto-memorize - looks for rich factual content.
        """
        user_input_lower = user_input.lower().strip()

        # Must be substantial content
        if len(user_input_lower) < 15:
            return False

        # High-probability memory extraction patterns
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

        # Check if message contains memory-rich content
        for pattern in memory_rich_patterns:
            if re.search(pattern, user_input_lower):
                return True

        # Check for lists of personal information
        if any(word in user_input_lower for word in ['family', 'children', 'kids', 'parents', 'siblings']):
            return True

        # Check for emotional milestones
        if any(word in user_input_lower for word in ['proud', 'accomplished', 'achieved', 'graduated', 'married', 'divorced']):
            return True

        return False

    def _enhanced_auto_memory_extraction(self, user_input: str) -> dict:
        """
        Enhanced immediate memory extraction using the LLM to understand context.
        This extracts memories right away when rich content is detected.
        """
        try:
            # Create a focused extraction prompt
            extraction_prompt = """You are a memory extraction AI. Read the user's message and extract any important, specific facts about them.

For each fact you find, output a JSON object in this exact format:
{"tool_call": "save_memory", "args": {"key": "CATEGORY", "value": "SPECIFIC_DETAIL"}}

Examples of what to extract:
- Identity: "I am a doctor" → {"key": "Profession", "value": "doctor"}
- Relationships: "My daughter Emma just turned 5" → {"key": "Family", "value": "has daughter Emma who is 5 years old"}
- Preferences: "I love hiking on weekends" → {"key": "Hobbies", "value": "enjoys hiking on weekends"}
- Life events: "I just graduated from college" → {"key": "Education", "value": "recently graduated from college"}
- Location: "I live in Chicago" → {"key": "Location", "value": "lives in Chicago"}

Only extract clear, specific facts. Be conservative. If no clear facts are found, don't extract anything.

User message: """ + user_input

            messages = [
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": user_input}
            ]

            # Get LLM response
            response = self.llm_service.chat(messages)
            llm_reply = response.get('message', {}).get('content', '')

            if not llm_reply:
                return {"status": "no_response"}

            # Process the extraction
            memories_saved = []
            
            # Strip markdown code blocks if present
            clean_reply = llm_reply.strip()
            if clean_reply.startswith('```json'):
                clean_reply = clean_reply[7:]
            elif clean_reply.startswith('```'):
                clean_reply = clean_reply[3:]
            if clean_reply.endswith('```'):
                clean_reply = clean_reply[:-3]
            clean_reply = clean_reply.strip()

            if clean_reply.startswith('{') and clean_reply.endswith('}'):
                try:
                    parsed = json.loads(clean_reply)
                    if isinstance(parsed, dict) and parsed.get('tool_call') == 'save_memory':
                        args = parsed.get('args', {})
                        key = args.get('key', '').strip()
                        value = args.get('value', '').strip()
                        if key and value:
                            # Check if we already know this
                            existing_memories = self._get_all_memories()
                            is_duplicate = any(
                                key.lower() in mem['key'].lower() and
                                value.lower() in mem['value'].lower()
                                for mem in existing_memories
                            )

                            if not is_duplicate:
                                self._save_memory_tool(key, value)
                                memories_saved.append({"key": key, "value": value})
                                logger.info(f"Enhanced auto-saved memory: {key} = {value}")
                except json.JSONDecodeError:
                    pass  # Fall through, no valid JSON found

            return {
                "status": "completed",
                "memories_saved": len(memories_saved),
                "memories": memories_saved
            }

        except Exception as e:
            logger.error(f"Enhanced auto memory extraction error: {e}")
            return {"status": "error", "error": str(e)}

    def _auto_analyze_and_log_mood(self, user_input: str) -> dict:
        """
        Automatically analyzes user input for mood and logs it to Supabase.
        Uses EmotionAnalysisService (Z.ai) for deeper analysis.
        """
        try:
            # Use EmotionAnalysisService
            analysis = self.analyzer_service.analyze_message(user_input)
            
            if not analysis:
                logger.warning("Mood analysis returned invalid result")
                return None
            
            # Extract data
            mood_score = analysis.get('sentiment_score', 0.0)
            topics = analysis.get('topics', [])
            detected_topic = topics[0] if topics else "General"
            
            # Determine label based on score
            if mood_score >= 0.5:
                mood_label = "Great"
            elif mood_score >= 0.05:
                mood_label = "Good"
            elif mood_score <= -0.5:
                mood_label = "Heavy"
            elif mood_score <= -0.05:
                mood_label = "Low"
            else:
                mood_label = "Neutral"
                
            # Log to Supabase
            try:
                self.supabase.table('mood_logs').insert({
                    'user_id': self.get_current_user_id(),
                    'score': mood_score,
                    'label': mood_label,
                    'topic': detected_topic,
                    'timestamp': datetime.utcnow().isoformat()
                }).execute()
                
                logger.info(f"Auto mood logged: score={mood_score:.2f}, label={mood_label}, topic={detected_topic}")
                return {"score": mood_score, "label": mood_label, "topic": detected_topic}
                
            except Exception as e:
                logger.error(f"Failed to log mood in Supabase: {e}")
                return {"score": mood_score, "label": mood_label, "topic": detected_topic}

        except Exception as e:
            logger.error(f"Auto mood analysis failed: {e}", exc_info=True)
            return None

    # ====== Helper Methods ======

    def _get_listening_acknowledgement(self):
        """Returns a gentle, rotating acknowledgement for listening mode."""
        ack = self.listening_acknowledgements[self._acknowledgement_index]
        self._acknowledgement_index = (self._acknowledgement_index + 1) % len(self.listening_acknowledgements)
        return ack

    def _should_auto_memorize(self, user_input: str, bot_reply: str):
        """Determines if the exchange contains memorizable content."""
        if not self.auto_memory_extraction_enabled:
            return False

        user_id = self.get_current_user_id()

        # Respect cooldown
        if user_id in self.last_memorize_time:
            if (datetime.utcnow() - self.last_memorize_time[user_id]).seconds < AUTO_MEMORIZE_COOLDOWN:
                return False

        # Check for meaningful content
        combined_text = f"{user_input} {bot_reply}".lower()

        # Skip if too short or mostly small talk
        if len(combined_text.strip()) < 40:
            return False

        # Check for potential factual content patterns
        memorizable_patterns = [
            r"\bi am\b", r"\bi work\b", r"\bmy name\b", r"\bi live\b",
            r"\bi have\b", r"\bi like\b", r"\bi don't like\b", r"\bmy \w+ is\b",
            r"\bfamily\b", r"\bjob\b", r"\bwork\b", r"\bschool\b", r"\bhome\b"
        ]

        return any(re.search(pattern, combined_text) for pattern in memorizable_patterns)

    def _auto_memorize(self, user_input: str, bot_reply: str):
        """
        Automatically extracts and stores memories from conversation using Z.ai LLM.
        Replaces old regex-based approach with semantic extraction.
        """
        try:
            # Skip if text is too short
            if len(user_input) < 10:
                return

            # Construct prompt for Z.ai
            prompt = f"""
            Analyze the following user message and extract any permanent or semi-permanent facts about the user.
            Focus on: names, jobs, location, relationships, preferences, important life events, or recurring struggles.
            Ignore transient states (like "I'm hungry") unless they imply a pattern.
            
            User Message: "{user_input}"
            
            If no important facts are found, return "NO_FACTS".
            If facts are found, return them in JSON format:
            [
                {{"category": "Personal", "fact": "User's name is X"}},
                {{"category": "Work", "fact": "User works as Y"}}
            ]
            Return ONLY the JSON or "NO_FACTS".
            """
            
            # Call LLM (using a separate lightweight call)
            response = self.llm_service.client.chat.completions.create(
                model=self.llm_service.model,
                messages=[
                    {"role": "system", "content": "You are a precise fact extractor. Output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.1
            )
            
            content = response.choices[0].message.content.strip()
            
            if content == "NO_FACTS" or not content.startswith("["):
                return

            try:
                facts = json.loads(content)
                user_id = self.get_current_user_id()
                
                for item in facts:
                    category = item.get('category', 'General')
                    fact = item.get('fact')
                    
                    if fact:
                        # Check for duplicates (simple check)
                        # In a real system, we'd use vector similarity here
                        self._save_memory_tool(category, fact)
                        logger.info(f"Auto-memorized ({category}): {fact}")
                
                self.last_memorize_time[user_id] = datetime.utcnow()
                
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse memory JSON: {content}")

        except Exception as e:
            logger.error(f"Auto-memorization error: {e}")

    def _prune_history_by_tokens(self, history, max_tokens):
        """Keeps history under token limit, prioritizing recent exchanges."""
        total_tokens = 0
        pruned_history = []

        # Count tokens from end (most recent)
        for message in reversed(history):
            # Rough token estimation (4 chars = 1 token average)
            message_tokens = len(message['content']) // 4 + 2
            if total_tokens + message_tokens <= max_tokens:
                pruned_history.append(message)
                total_tokens += message_tokens
            else:
                break

        return list(reversed(pruned_history))

    def _get_mood_context(self):
        """Gets recent mood context using cached data."""
        try:
            # Try cache first
            mood_context = self.mood_context_cache.get_mood_context(self.get_current_user_id())
            if mood_context:
                return mood_context

            # Get recent mood scores
            recent_scores = self._get_recent_mood_scores(limit=2)

            if len(recent_scores) == 0:
                mood_context = "Unknown mood (no data)"
            elif len(recent_scores) == 1:
                score = recent_scores[0]
                if score > 0.3:
                    mood_context = "Positive mood"
                elif score < -0.3:
                    mood_context = "Negative mood"
                else:
                    mood_context = "Neutral mood"
            else:
                # Analyze trend
                current, previous = recent_scores[0], recent_scores[1]
                change = current - previous

                if current > 0.3:
                    mood_context = f"Positive mood"
                elif current < -0.3:
                    mood_context = f"Negative mood"
                else:
                    mood_context = f"Neutral mood"

                if abs(change) > 0.2:
                    if change > 0:
                        mood_context += " (improving)"
                    else:
                        mood_context += " (declining)"

            # Cache the result
            self.mood_context_cache.set_mood_context(self.get_current_user_id(), mood_context)
            return mood_context

        except Exception as e:
            logger.error(f"Error getting mood context: {e}")
            return "Mood context unavailable"

    def _get_recent_mood_context(self):
        """Gets recent mood context for proactive check-in system."""
        try:
            recent_scores = self._get_recent_mood_scores(limit=5)

            if len(recent_scores) < 3:
                return {"is_negative_trend": False, "avg_mood": 0, "trend": "insufficient_data"}

            avg_mood = sum(recent_scores) / len(recent_scores)

            # Check trend (last 2 vs previous 2)
            if len(recent_scores) >= 4:
                recent_avg = sum(recent_scores[:2]) / 2
                previous_avg = sum(recent_scores[2:4]) / 2
                trend = recent_avg - previous_avg
            else:
                trend = 0

            is_negative_trend = avg_mood < -0.1 and trend < 0

            return {
                "is_negative_trend": is_negative_trend,
                "avg_mood": avg_mood,
                "trend": "declining" if trend < -0.1 else "stable" if abs(trend) <= 0.1 else "improving"
            }

        except Exception as e:
            logger.error(f"Error getting recent mood context: {e}")
            return {"is_negative_trend": False, "avg_mood": 0, "trend": "error"}

    def _get_memories_for_context(self, user_input):
        """Gets relevant memories for LLM context using semantic search."""
        try:
            # Check cache first
            # Check cache first
            cached_memories = self.search_result_cache.get_search_results(self.get_current_user_id(), user_input, 5)
            if cached_memories:
                # Format cached results
                if isinstance(cached_memories, list):
                    return ", ".join([f"{mem['key']}: {mem['value']}" for mem in cached_memories])
                return cached_memories

            # Get all memories with embeddings
            all_mems = self._get_all_memories(with_embeddings=True)

            if not all_mems:
                return "No memories about user yet."

            # Simple keyword matching for now (can be enhanced with proper semantic search)
            user_input_lower = user_input.lower()
            relevant_memories = []

            for mem in all_mems:
                # Basic keyword relevance
                memory_text = f"{mem.get('key', '')} {mem.get('value', '')}".lower()
                relevance = 0

                # Check for keyword overlap
                user_words = set(user_input_lower.split())
                memory_words = set(memory_text.split())

                if user_words & memory_words:  # Intersection
                    relevance = len(user_words & memory_words) / max(len(user_words), len(memory_words))

                # Boost recent and high-importance memories
                if mem.get('importance', 0) > 0.7:
                    relevance *= 1.2

                if relevance > 0.1:
                    relevant_memories.append({
                        'key': mem.get('key', ''),
                        'value': mem.get('value', ''),
                        'relevance': relevance
                    })

            # Sort by relevance and take top 5
            relevant_memories.sort(key=lambda x: x['relevance'], reverse=True)
            top_memories = relevant_memories[:5]

            # Format for LLM
            if top_memories:
                formatted = ", ".join([f"{mem['key']}: {mem['value']}" for mem in top_memories])
            else:
                formatted = "No directly relevant memories."

            # Cache result
            self.search_result_cache.set_search_results(self.get_current_user_id(), user_input, 5, top_memories)

            return formatted

        except Exception as e:
            logger.error(f"Error getting memories for context: {e}")
            return "Memory search temporarily unavailable."

    def log_mood(self, mood_score: float):
        """Logs mood and updates user model."""
        try:
            # Determine mood label and topic
            if mood_score > 0.5:
                label = "positive"
                topic = "happiness"
            elif mood_score < -0.5:
                label = "negative"
                topic = "sadness"
            elif mood_score > 0:
                label = "slightly_positive"
                topic = "contentment"
            else:
                label = "slightly_negative"
                topic = "concern"

            # Log to Supabase
            self._log_mood(mood_score, label, topic)

            # Get recent scores for smoothing
            recent_scores = self._get_recent_mood_scores(limit=2)
            if recent_scores:
                recent_scores.append(mood_score)
                smoothed_score = sum(recent_scores) / len(recent_scores)
                self._log_mood(smoothed_score, f"smoothed_{label}", f"smoothed_{topic}")

        except Exception as e:
            logger.error(f"Error logging mood: {e}")

    def get_mood_history(self, days=7):
        """Returns mood history for visualization."""
        return self._get_mood_history(days=days)

    async def stream_reply(self, user_input: str):
        """Streams response token by token."""
        try:
            # Get full response first
            full_response = self.generate_reply(user_input)

            # Stream it character by character for responsiveness
            for char in full_response:
                yield char
                await asyncio.sleep(0.01)  # Small delay for streaming effect

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield "I'm having trouble streaming my response. Please try again."

    def get_recent_chat_messages(self, user_id: str, hours: int = 24):
        """Gets recent chat messages from Supabase."""
        try:
            cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
            result = self.supabase.table('messages').select('role, content, timestamp').eq('user_id', user_id).gte('timestamp', cutoff_time).order('timestamp', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Failed to get recent chat messages from Supabase: {e}")
            return []