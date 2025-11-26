"""
Emotion Analysis Service for Warmth App
Uses OpenAI GPT-4 to analyze chat messages for emotions, topics, and sentiment.
"""
import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import openai
from openai import OpenAI

from ..config import ZAI_API_KEY, ZAI_BASE_URL

logger = logging.getLogger(__name__)

class EmotionAnalysisService:
    """
    Analyzes chat messages to extract emotions, topics, and sentiment.
    """
    
    def __init__(self):
        """Initialize Z.ai client."""
        if not ZAI_API_KEY:
            logger.warning("ZAI_API_KEY not set - emotion analysis will be disabled")
            self.client = None
        else:
            self.client = OpenAI(api_key=ZAI_API_KEY, base_url=ZAI_BASE_URL)
    
    def analyze_message(self, message: str, context: List[Dict] = None) -> Dict:
        """
        Analyze a single message for emotions and topics.
        
        Args:
            message: The message text to analyze
            context: Optional list of previous messages for context
            
        Returns:
            Dict with emotions, topics, and sentiment score
        """
        if not self.client:
            return self._get_fallback_analysis()
        
        try:
            # Build context string
            context_str = ""
            if context:
                context_str = "\n".join([
                    f"{'User' if msg.get('role') == 'user' else 'Assistant'}: {msg.get('content', '')}"
                    for msg in context[-5:]  # Last 5 messages for context
                ])
            
            # Create analysis prompt with EXPLICIT JSON requirement
            prompt = f"""Analyze the following message for emotional content and topics.

Context (previous messages):
{context_str}

Current message to analyze:
{message}

You MUST respond with ONLY a valid JSON object matching this EXACT schema. Do not include any other text, markdown formatting, or explanations.

Schema:
{{
  "emotions": ["emotion1", "emotion2"],
  "topics": ["topic1", "topic2"],
  "sentiment_score": 0.5,
  "intensity": 0.7
}}

Rules:
- "emotions": Array of 1-5 emotions from: happy, sad, anxious, calm, tired, proud, frustrated, hopeful, lonely, grateful, overwhelmed, peaceful
- "topics": Array of 1-5 main topics discussed
- "sentiment_score": Float from -1.0 (very negative) to +1.0 (very positive)
- "intensity": Float from 0.0 (mild) to 1.0 (intense)

Return ONLY the JSON string."""

            # Call OpenAI API
            try:
                response = self.client.chat.completions.create(
                    model="GLM-4.5-Flash",  # Z.ai model name from user's plan
                    messages=[
                        {"role": "system", "content": "You are a JSON-only emotion analysis assistant. Always respond with valid JSON. No markdown, no commentary."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=150,
                    response_format={"type": "json_object"}
                )
            except Exception as e:
                # Handle rate limits (429) or other API errors gracefully
                logger.warning(f"Emotion analysis API call failed: {e}")
                return self._get_fallback_analysis()
            
            # Parse response with error handling
            content = response.choices[0].message.content.strip()
            if not content:
                logger.warning("Emotion analysis returned empty content")
                return self._get_fallback_analysis()

            try:
                result = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in emotion analysis: {e}. Content: {content[:200]}")
                return self._get_fallback_analysis()
            
            # Validate and normalize
            return {
                'emotions': result.get('emotions', [])[:5],  # Max 5 emotions
                'topics': result.get('topics', [])[:5],  # Max 5 topics
                'sentiment_score': max(-1.0, min(1.0, float(result.get('sentiment_score', 0)))),
                'intensity': max(0.0, min(1.0, float(result.get('intensity', 0.5)))),
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}", exc_info=True)
            return self._get_fallback_analysis()
    
    def generate_3day_recap(self, messages: List[Dict], user_id: str) -> Dict:
        """
        Generate a 3-day emotional recap from recent messages.
        
        Args:
            messages: List of messages from the last 3 days
            user_id: User ID for the recap
            
        Returns:
            Dict with headline, narrative, top emotions, topics, and recommendations
        """
        if not self.client or not messages:
            return self._get_fallback_recap()
        
        try:
            # Extract user messages only
            user_messages = [
                msg.get('content', '') 
                for msg in messages 
                if msg.get('role') == 'user'
            ]
            
            if not user_messages:
                return self._get_fallback_recap()
            
            # Aggregate existing emotion data
            all_emotions = []
            all_topics = []
            sentiment_scores = []
            
            for msg in messages:
                if msg.get('emotions'):
                    all_emotions.extend(msg['emotions'])
                if msg.get('topics'):
                    all_topics.extend(msg['topics'])
                if msg.get('sentiment_score') is not None:
                    sentiment_scores.append(msg['sentiment_score'])
            
            # Create recap prompt with EXPLICIT JSON requirement
            prompt = f"""Create a compassionate 3-day emotional summary for a user.

User's messages over the last 3 days:
{chr(10).join(user_messages[:20])}

Detected emotions: {', '.join(set(all_emotions))}
Detected topics: {', '.join(set(all_topics))}
Average sentiment: {sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0:.2f}

You MUST respond with ONLY a valid JSON object in this format:
{{
  "headline": "string",
  "narrative": "string",
  "top_emotions": [{{"emoji": "😔", "label": "tired", "count": 5}}],
  "key_topics": ["topic1", "topic2"],
  "recommendations": [{{"icon": "🫁", "title": "string", "action": "breathing"}}]
}}

Be warm and supportive. Respond with ONLY the JSON object."""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="GLM-4.5-Flash",
                messages=[
                    {"role": "system", "content": "You are a JSON-only emotional wellness assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300,
                response_format={"type": "json_object"}
            )
            
            # Parse response with error handling
            content = response.choices[0].message.content.strip()
            try:
                result = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in 3-day recap: {e}. Content: {content[:200]}")
                return self._get_fallback_recap()
            
            return {
                'user_id': user_id,
                'start_date': (datetime.utcnow() - timedelta(days=3)).isoformat(),
                'end_date': datetime.utcnow().isoformat(),
                'headline': result.get('headline', 'Your 3-day emotional journey'),
                'narrative': result.get('narrative', ''),
                'top_emotions': result.get('top_emotions', [])[:5],
                'key_topics': result.get('key_topics', [])[:5],
                'recommendations': result.get('recommendations', [])[:3],
                'created_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"3-day recap generation failed: {e}", exc_info=True)
            return self._get_fallback_recap()
    
    def _get_fallback_analysis(self) -> Dict:
        """Return fallback analysis when OpenAI is unavailable."""
        return {
            'emotions': [],
            'topics': [],
            'sentiment_score': 0.0,
            'intensity': 0.5,
            'analyzed_at': datetime.utcnow().isoformat(),
            'fallback': True
        }
    
    def _get_fallback_recap(self) -> Dict:
        """Return fallback recap when OpenAI is unavailable."""
        return {
            'headline': 'Keep sharing — I\'m here to listen',
            'narrative': 'Continue talking with me to build your emotional insights.',
            'top_emotions': [],
            'key_topics': [],
            'recommendations': [
                {
                    'icon': '💬',
                    'title': 'Keep chatting with me',
                    'action': 'chat'
                }
            ],
            'created_at': datetime.utcnow().isoformat(),
            'fallback': True
        }

    def get_memory_graph(self, messages: List[Dict], user_id: str) -> Dict:
        """
        Generate a memory graph (recurring topics) from user messages.
        
        Args:
            messages: List of all user messages
            user_id: User ID
            
        Returns:
            Dict with recurring topics and snippets
        """
        if not self.client or not messages:
            return self._get_fallback_memory_graph()
            
        try:
            # Extract user messages and topics
            user_messages = []
            all_topics = []
            
            for msg in messages:
                if msg.get('role') == 'user':
                    user_messages.append(msg.get('content', ''))
                    if msg.get('topics'):
                        all_topics.extend(msg['topics'])
            
            if not user_messages:
                return self._get_fallback_memory_graph()
                
            # Calculate topic frequency
            topic_counts = {}
            for topic in all_topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
                
            # Get top 5 recurring topics
            sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            top_topics = [t[0] for t in sorted_topics]
            
            if not top_topics:
                return self._get_fallback_memory_graph()

            # Create prompt to find snippets for these topics
            prompt = f"""Analyze these user messages and find a representative short snippet (max 10 words) for each recurring topic.

User messages:
{chr(10).join(user_messages[-50:])}  # Analyze last 50 messages

Recurring topics: {', '.join(top_topics)}

For each topic, find one short quote or summary snippet from the user's messages that best represents their feelings about that topic.

Respond ONLY with a JSON array of objects:
[
  {{ "topic": "Work", "count": 5, "snippet": "Feeling overwhelmed by deadlines" }},
  ...
]
Use the exact topic names provided.
"""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="GLM-4.5-Flash",
                messages=[
                    {"role": "system", "content": "You are a JSON-only memory assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200,
                response_format={"type": "json_object"}
            )
            
            # Parse response with error handling
            content = response.choices[0].message.content.strip()
            try:
                result = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error in memory graph: {e}. Content: {content[:200]}")
                return self._get_fallback_memory_graph()
            memories = result.get('memories', [])
            
            # If the model didn't return 'memories' key directly, try to parse the list
            if not memories and isinstance(result, list):
                memories = result
            elif not memories and 'topics' in result:
                memories = result['topics']
                
            # Merge with counts
            final_memories = []
            for m in memories:
                topic_name = m.get('topic')
                if topic_name in topic_counts:
                    m['count'] = topic_counts[topic_name]
                    m['id'] = len(final_memories) + 1
                    final_memories.append(m)
            
            return {
                'memories': final_memories,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Memory graph generation failed: {e}", exc_info=True)
            return self._get_fallback_memory_graph()

    def _get_fallback_memory_graph(self) -> Dict:
        """Return fallback memory graph."""
        return {
            'memories': [],
            'generated_at': datetime.utcnow().isoformat(),
            'fallback': True
        }

# Singleton instance
_emotion_service = None

def get_emotion_service() -> EmotionAnalysisService:
    """Get or create the emotion analysis service singleton."""
    global _emotion_service
    if _emotion_service is None:
        _emotion_service = EmotionAnalysisService()
    return _emotion_service
