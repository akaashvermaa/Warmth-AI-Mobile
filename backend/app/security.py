"""
Security utilities for Warmth application with Supabase Auth.
Handles authentication, encryption, secure logging, and CSRF protection.
"""
import os
import hashlib
import secrets
import base64
import logging
from functools import wraps
from flask import session, request, jsonify, abort
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import jwt
from supabase import Client

logger = logging.getLogger(__name__)

# === JWT Authentication with Supabase ===

def validate_supabase_jwt(token: str, supabase: Client) -> dict:
    """
    Validates a Supabase JWT token and extracts user information.

    Args:
        token: JWT token from Authorization header
        supabase: Supabase client instance

    Returns:
        dict: User information if valid, None if invalid
    """
    try:
        # 1. Try Supabase client validation first
        try:
            user = supabase.auth.get_user(token)
            if user and hasattr(user, 'user'):
                return {
                    'id': user.user.id,
                    'email': user.user.email,
                    'aud': user.user.aud,
                    'role': user.user.role,
                    'confirmed_at': str(user.user.confirmed_at) if user.user.confirmed_at else None
                }
        except Exception as supabase_error:
            # Supabase validation failed, check if it's a mock token
            pass

        # 2. Fallback: Check if it's a valid Mock Dev Token
        # (Only if Supabase validation failed)
        # DISABLED BY USER REQUEST
        # try:
        #     mock_secret = 'dev_secret_key_change_in_production'
        #     payload = jwt.decode(token, mock_secret, algorithms=['HS256'])
        #     
        #     # Check if it's a dev token
        #     if payload.get('app_metadata', {}).get('provider') == 'development':
        #         logger.info(f"Valid mock token accepted for user: {payload.get('sub')}")
        #         return {
        #             'id': payload.get('sub'),
        #             'email': payload.get('email'),
        #             'aud': payload.get('aud'),
        #             'role': payload.get('role'),
        #             'is_mock': True
        #         }
        # except jwt.ExpiredSignatureError:
        #     logger.warning("Mock token expired")
        # except jwt.InvalidTokenError:
        #     pass # Not a valid mock token either

        return None

    except Exception as e:
        logger.warning(f"JWT validation failed: {e}")
        return None

def extract_auth_token() -> str:
    """
    Extracts JWT token from request header.

    Returns:
        str: JWT token if found, None otherwise
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    return None

# === Encryption for Exported Data (Keep these) ===

def generate_encryption_key(password: str = None) -> bytes:
    """Generates an encryption key from a password or creates a new one."""
    if password:
        # Derive key from password
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'warmth_export_salt',  # In production, use random salt per export
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    else:
        # Generate random key
        key = Fernet.generate_key()
    return key

def encrypt_data(data: str, password: str = None) -> str:
    """
    Encrypts data using Fernet symmetric encryption.
    If password is provided, derives key from it. Otherwise uses random key.
    """
    key = generate_encryption_key(password)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted).decode()

def decrypt_data(encrypted_data: str, password: str = None, key: bytes = None) -> str:
    """
    Decrypts data. Requires either password or key.
    """
    if key:
        fernet = Fernet(key)
    elif password:
        key = generate_encryption_key(password)
        fernet = Fernet(key)
    else:
        raise ValueError("Either password or key must be provided")

    try:
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        raise ValueError("Failed to decrypt data. Invalid password or corrupted data.")

# === Secure Logging ===

def hash_message(message: str, max_length: int = 50) -> str:
    """
    Creates a secure hash of a message for logging.
    Returns truncated message + hash for debugging while protecting privacy.
    """
    if not message:
        return "empty"

    # Truncate message
    truncated = message[:max_length] if len(message) > max_length else message

    # Create hash of full message
    message_hash = hashlib.sha256(message.encode()).hexdigest()[:16]  # First 16 chars of hash

    if len(message) > max_length:
        return f"{truncated}...[hash:{message_hash}]"
    else:
        return f"{truncated}[hash:{message_hash}]"

def secure_log_message(message: str, log_level: str = "info") -> None:
    """
    Logs a message securely (truncated + hashed).
    """
    secure_msg = hash_message(message)
    if log_level == "warning":
        logger.warning(f"Message: {secure_msg}")
    elif log_level == "error":
        logger.error(f"Message: {secure_msg}")
    else:
        logger.info(f"Message: {secure_msg}")

# === CSRF Protection ===

def generate_csrf_token() -> str:
    """Generates a CSRF token."""
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']

def validate_csrf_token(token: str) -> bool:
    """Validates a CSRF token."""
    if 'csrf_token' not in session:
        return False
    return secrets.compare_digest(session['csrf_token'], token)

def csrf_protect(f):
    """
    Decorator to protect routes with CSRF tokens.
    Only applies if ENABLE_CSRF is True (for LAN access).
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        enable_csrf = os.getenv('ENABLE_CSRF', 'false').lower() == 'true'

        if not enable_csrf:
            # CSRF protection disabled (localhost only)
            return f(*args, **kwargs)

        # CSRF protection enabled (LAN access)
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            # Get token from header or form data
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token') or request.json.get('csrf_token') if request.is_json else None

            if not token or not validate_csrf_token(token):
                logger.warning(f"CSRF token validation failed for {request.path}")
                abort(403)

        return f(*args, **kwargs)
    return decorated_function

# === NEW: Supabase Authentication Decorator ===

def require_auth(f):
    """
    Decorator to require Supabase JWT authentication for routes.
    Extracts and validates JWT from Authorization header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For development, allow skipping auth
        enable_auth = os.getenv('ENABLE_AUTH', 'true').lower() == 'true'

        if not enable_auth:
            # Authentication disabled for development
            request.current_user = {
                'id': os.getenv('DEFAULT_USER_ID', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
                'email': 'dev@local.dev'
            }
            return f(*args, **kwargs)

        # Extract JWT token from Authorization header
        token = extract_auth_token()
        if not token:
            return jsonify({
                "error": "Authentication required",
                "message": "Missing Authorization header with Bearer token"
            }), 401

        # Get Supabase client from the Flask app
        from flask import current_app
        supabase = current_app.supabase

        # Validate the JWT token
        user_info = validate_supabase_jwt(token, supabase)
        if not user_info:
            return jsonify({
                "error": "Invalid or expired token",
                "message": "Please sign in again"
            }), 401

        # Set user info in request context
        request.current_user = user_info

        return f(*args, **kwargs)
    return decorated_function

def get_current_user_id() -> str:
    """
    Helper function to get current user ID from JWT token.
    Extracts user ID directly from the Authorization header.

    Returns:
        str: Current user ID from JWT token, or 'local_user' if no valid token
    """
    # First check if user is already in request context
    user_id = getattr(request, 'current_user', {}).get('id')
    if user_id:
        return user_id
    
    # Extract JWT token from Authorization header
    token = extract_auth_token()
    if not token:
        logger.warning("No auth token found, using 'local_user'")
        return 'local_user'
    
    # Validate and extract user from token
    try:
        from flask import current_app
        supabase = current_app.supabase
        user_info = validate_supabase_jwt(token, supabase)
        
        if user_info and 'id' in user_info:
            # Cache in request context for future calls
            request.current_user = user_info
            return user_info['id']
        else:
            logger.warning("Invalid token, using 'local_user'")
            return 'local_user'
    except Exception as e:
        logger.error(f"Error extracting user from token: {e}")
        return 'local_user'

def get_current_user_info() -> dict:
    """
    Helper function to get current user info from request context.

    Returns:
        dict: Current user information
    """
    return getattr(request, 'current_user', {'id': 'local_user', 'email': 'dev@local.dev'})