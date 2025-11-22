import os

# Model Configuration
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')

# Database Configuration - Supabase
# IMPORTANT: These must be set via environment variables for security
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Chat Configuration
CHAT_HISTORY_LENGTH = int(os.getenv('CHAT_HISTORY_LENGTH', '10'))
MAX_HISTORY_TOKENS = int(os.getenv('MAX_HISTORY_TOKENS', '2000'))
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '30'))
SLOW_RESPONSE_THRESHOLD = float(os.getenv('SLOW_RESPONSE_THRESHOLD', '5.0'))
AUTO_MEMORIZE_COOLDOWN = int(os.getenv('AUTO_MEMORIZE_COOLDOWN', '10'))

# User Configuration
DEFAULT_USER_ID = os.getenv('DEFAULT_USER_ID', 'b62ed4f8-6b5c-4095-9096-dfef6c968182')

# Security Configuration
# IMPORTANT: FLASK_SECRET_KEY must be set via environment variable for security
ENABLE_AUTH = os.getenv('ENABLE_AUTH', 'false').lower() == 'true'
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')

# Performance Configuration
CACHE_MAX_AGE = int(os.getenv('CACHE_MAX_AGE', '31536000'))
HEAVY_TASK_WORKERS = int(os.getenv('HEAVY_TASK_WORKERS', '4'))