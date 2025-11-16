# Warmth - Mental Health Companion

A compassionate AI companion designed to provide emotional support and mental wellness assistance.

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download NLTK Data**
   ```bash
   python setup_nltk.py
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env` (if present)
   - Set your Supabase URL and keys in environment or config.py
   - Configure Ollama model if using local LLM

3. **Run the Application**
   ```bash
   python run.py
   ```

## Configuration

The app uses environment variables for configuration. See `app/config.py` for available options:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase public key
- `OLLAMA_MODEL`: LLM model to use (default: llama3.2)

## Features

- **Chat Interface**: Natural conversation with AI companion
- **Mood Tracking**: Monitor emotional patterns over time
- **Memory System**: Remembers important details about you
- **Real-world Tools**: Weather, news, and reminders
- **Proactive Check-ins**: Automatic wellness checks

## Architecture

- **Backend**: Flask with Supabase database
- **AI**: Local Ollama integration for privacy
- **Frontend**: Clean, responsive web interface
- **Storage**: Cloud-based Supabase for data persistence

## Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests
pytest
```

## Database

This application uses Supabase as its backend database. Ensure you have:

1. A Supabase project created
2. The necessary tables set up (memories, mood_logs, chat_messages, etc.)
3. Proper authentication configured