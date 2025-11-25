import os

# Z.ai Configuration (OpenAI-compatible API)
# IMPORTANT: API key must be set via environment variable for security
ZAI_API_KEY = os.getenv('ZAI_API_KEY')
ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4'
ZAI_MODEL = 'glm-4-flash'  # Free tier model - lowest cost
ZAI_TEMPERATURE = 0.3  # Low temperature for concise, predictable responses
ZAI_TIMEOUT = 30  # Request timeout in seconds

# Token Limits (Cost Control)
MAX_INPUT_TOKENS = 500  # Trim inputs longer than this
MAX_OUTPUT_TOKENS = 150  # Limit response length
DAILY_TOKEN_LIMIT = 50000  # Daily usage cap to prevent runaway costs

# Database Configuration - Supabase
# IMPORTANT: These must be set via environment variables for security
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Chat Configuration
CHAT_HISTORY_LENGTH = int(os.getenv('CHAT_HISTORY_LENGTH', '10'))
MAX_HISTORY_TOKENS = int(os.getenv('MAX_HISTORY_TOKENS', '2000'))
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
LLM_CACHE_TTL = int(os.getenv('LLM_CACHE_TTL', '3600'))  # LLM response cache (1 hour)