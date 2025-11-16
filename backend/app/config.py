import os

# Model Configuration
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')

# Database Configuration - Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://kvdrnoctdtqzwdcsjcvy.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHJub2N0ZHRxendkY3NqY3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjc3NDAsImV4cCI6MjA3ODgwMzc0MH0.pj81fpJPjYmN7SBnvyxOCqLg_rggIihMr5V1ZOqRJy8')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHJub2N0ZHRxendkY3NqY3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyNzc0MCwiZXhwIjoyMDc4ODAzNzQwfQ.UV7E-0E5CpCAfRX2gIZPLVB3fxBFjdmDE7RXrhOmucY')

# Chat Configuration
CHAT_HISTORY_LENGTH = int(os.getenv('CHAT_HISTORY_LENGTH', '10'))
MAX_HISTORY_TOKENS = int(os.getenv('MAX_HISTORY_TOKENS', '2000'))
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '30'))
SLOW_RESPONSE_THRESHOLD = float(os.getenv('SLOW_RESPONSE_THRESHOLD', '5.0'))
AUTO_MEMORIZE_COOLDOWN = int(os.getenv('AUTO_MEMORIZE_COOLDOWN', '10'))

# User Configuration
DEFAULT_USER_ID = os.getenv('DEFAULT_USER_ID', 'local_user')

# Security Configuration
ENABLE_AUTH = os.getenv('ENABLE_AUTH', 'false').lower() == 'true'
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', None)
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')

# Performance Configuration
CACHE_MAX_AGE = int(os.getenv('CACHE_MAX_AGE', '31536000'))
HEAVY_TASK_WORKERS = int(os.getenv('HEAVY_TASK_WORKERS', '4'))