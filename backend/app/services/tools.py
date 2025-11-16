# app/services/tools.py
"""
Real-world tools for Warmth chatbot functionality.
Provides useful, real-world actions beyond just journaling.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import re

logger = logging.getLogger(__name__)

class RealWorldTools:
    """Collection of real-world tools for Warmth."""

    def __init__(self):
        self.weather_api_key = None  # Set via environment variable WEATHER_API_KEY if needed
        self.news_api_key = None     # Set via environment variable NEWS_API_KEY if needed
        self.reminders = {}          # In-memory reminder storage (consider database for persistence)

    def get_current_weather(self, location: str) -> Dict:
        """
        Get current weather information for a location.

        Args:
            location: City name, postal code, or coordinates

        Returns:
            Dictionary with weather information or error message
        """
        try:
            # For demo purposes, return mock data
            # In production, integrate with OpenWeatherMap API or similar
            if not location:
                return {"error": "Location is required"}

            # Mock weather data - replace with real API call
            mock_weather = {
                "location": location,
                "temperature": "72°F",
                "condition": "Partly Cloudy",
                "humidity": "65%",
                "wind": "8 mph",
                "description": f"Pleasant weather in {location} with partly cloudy skies"
            }

            logger.info(f"Weather requested for {location}")
            return mock_weather

        except Exception as e:
            logger.error(f"Error getting weather for {location}: {e}")
            return {"error": f"Unable to get weather information: {str(e)}"}

    def get_news_headlines(self, topic: str = "general", max_headlines: int = 5) -> Dict:
        """
        Get news headlines for a specific topic.

        Args:
            topic: News topic (e.g., "technology", "sports", "business")
            max_headlines: Maximum number of headlines to return

        Returns:
            Dictionary with news headlines or error message
        """
        try:
            if not topic:
                topic = "general"

            # Mock news data - replace with real API call (NewsAPI, Guardian API, etc.)
            mock_headlines = {
                "topic": topic,
                "headlines": [
                    {
                        "title": f"Latest developments in {topic.capitalize()} sector",
                        "description": "Breaking news shows significant changes in the industry",
                        "source": "News Network",
                        "published_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                    },
                    {
                        "title": f"Experts weigh in on {topic} trends",
                        "description": "Industry leaders share their insights on current events",
                        "source": "Daily News",
                        "published_at": (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M")
                    },
                    {
                        "title": f"Analysis: What the latest {topic} news means for you",
                        "description": "Our experts break down the implications of recent events",
                        "source": "News Analysis",
                        "published_at": (datetime.now() - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M")
                    }
                ][:max_headlines]
            }

            logger.info(f"News headlines requested for topic: {topic}")
            return mock_headlines

        except Exception as e:
            logger.error(f"Error getting news headlines for {topic}: {e}")
            return {"error": f"Unable to get news headlines: {str(e)}"}

    def set_a_reminder(self, time: str, reminder_text: str) -> Dict:
        """
        Set a reminder for a specific time.

        Args:
            time: Time description (e.g., "in 30 minutes", "tomorrow at 9am", "2pm")
            reminder_text: What to remind about

        Returns:
            Dictionary with reminder confirmation or error message
        """
        try:
            if not reminder_text:
                return {"error": "Reminder text is required"}

            if not time:
                return {"error": "Time is required"}

            # Generate unique reminder ID
            reminder_id = f"reminder_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Parse time (simple implementation)
            reminder_time = self._parse_reminder_time(time)
            if not reminder_time:
                return {"error": f"Could not understand time: {time}"}

            # Store reminder
            reminder = {
                "id": reminder_id,
                "time": reminder_time,
                "text": reminder_text,
                "original_time_input": time,
                "created_at": datetime.now()
            }

            self.reminders[reminder_id] = reminder

            response = {
                "success": True,
                "reminder_id": reminder_id,
                "message": f"I'll remind you: '{reminder_text}' at {reminder_time.strftime('%Y-%m-%d %H:%M')}",
                "reminder_time": reminder_time.strftime("%Y-%m-%d %H:%M"),
                "reminder_text": reminder_text
            }

            logger.info(f"Reminder set: {reminder_text} at {reminder_time}")
            return response

        except Exception as e:
            logger.error(f"Error setting reminder: {e}")
            return {"error": f"Unable to set reminder: {str(e)}"}

    def get_active_reminders(self) -> Dict:
        """Get list of active reminders."""
        try:
            current_time = datetime.now()
            active_reminders = []

            for reminder_id, reminder in self.reminders.items():
                if reminder["time"] > current_time:
                    active_reminders.append({
                        "id": reminder_id,
                        "time": reminder["time"].strftime("%Y-%m-%d %H:%M"),
                        "text": reminder["text"],
                        "time_until": self._format_time_until(reminder["time"] - current_time)
                    })

            # Sort by time
            active_reminders.sort(key=lambda x: x["time"])

            return {
                "active_reminders": active_reminders,
                "count": len(active_reminders)
            }

        except Exception as e:
            logger.error(f"Error getting active reminders: {e}")
            return {"error": f"Unable to get reminders: {str(e)}"}

    def cancel_reminder(self, reminder_id: str) -> Dict:
        """Cancel a specific reminder."""
        try:
            if reminder_id in self.reminders:
                reminder = self.reminders.pop(reminder_id)
                return {
                    "success": True,
                    "message": f"Reminder cancelled: '{reminder['text']}'"
                }
            else:
                return {"error": "Reminder not found"}

        except Exception as e:
            logger.error(f"Error cancelling reminder: {e}")
            return {"error": f"Unable to cancel reminder: {str(e)}"}

    def _parse_reminder_time(self, time_str: str) -> Optional[datetime]:
        """
        Parse human-readable time string into datetime.
        Simple implementation - can be enhanced with more sophisticated parsing.
        """
        try:
            current_time = datetime.now()
            time_str = time_str.lower().strip()

            # Handle "in X minutes/hours"
            if "in " in time_str:
                match = re.search(r'in (\d+)\s*(minute|hour|day)s?', time_str)
                if match:
                    amount = int(match.group(1))
                    unit = match.group(2)

                    if unit.startswith("minute"):
                        return current_time + timedelta(minutes=amount)
                    elif unit.startswith("hour"):
                        return current_time + timedelta(hours=amount)
                    elif unit.startswith("day"):
                        return current_time + timedelta(days=amount)

            # Handle "tomorrow at X"
            if "tomorrow" in time_str:
                match = re.search(r'(\d{1,2})(:\d{2})?\s*(am|pm)?', time_str)
                if match:
                    hour = int(match.group(1))
                    minute = int(match.group(2)[1:]) if match.group(2) else 0
                    period = match.group(3)

                    if period == "pm" and hour != 12:
                        hour += 12
                    elif period == "am" and hour == 12:
                        hour = 0

                    tomorrow = current_time + timedelta(days=1)
                    return tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)

            # Handle specific times today (e.g., "2pm", "3:30pm", "9am")
            match = re.search(r'(\d{1,2})(:\d{2})?\s*(am|pm)?', time_str)
            if match and "tomorrow" not in time_str:
                hour = int(match.group(1))
                minute = int(match.group(2)[1:]) if match.group(2) else 0
                period = match.group(3)

                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0

                # If time has passed today, schedule for tomorrow
                reminder_time = current_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if reminder_time <= current_time:
                    reminder_time += timedelta(days=1)

                return reminder_time

            return None

        except Exception as e:
            logger.error(f"Error parsing time '{time_str}': {e}")
            return None

    def _format_time_until(self, time_delta: timedelta) -> str:
        """Format time delta into human-readable string."""
        total_seconds = int(time_delta.total_seconds())

        if total_seconds < 60:
            return f"{total_seconds} seconds"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        elif total_seconds < 86400:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if minutes > 0:
                return f"{hours} hour{'s' if hours != 1 else ''} {minutes} minute{'s' if minutes != 1 else ''}"
            return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            days = total_seconds // 86400
            hours = (total_seconds % 86400) // 3600
            if hours > 0:
                return f"{days} day{'s' if days != 1 else ''} {hours} hour{'s' if hours != 1 else ''}"
            return f"{days} day{'s' if days != 1 else ''}"

# Global instance for use across the application
tools_instance = RealWorldTools()