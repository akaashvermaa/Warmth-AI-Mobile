# app/web/auth.py
"""
Supabase Authentication endpoints for Warmth AI
Provides JWT-based authentication using Supabase Auth
"""
import os
import logging
import secrets
from flask import Blueprint, request, jsonify, current_app
from supabase import Client
from .. import security_headers
from ..security import require_auth

bp = Blueprint('auth', __name__, url_prefix='/auth')
logger = logging.getLogger(__name__)

@bp.route('/status', methods=['GET'])
def auth_status():
    """
    GET /auth/status
    Returns authentication status and basic user info.
    """
    try:
        # Check if authentication is enabled
        enable_auth = os.getenv('ENABLE_AUTH', 'true').lower() == 'true'

        response = {
            "auth_enabled": enable_auth,
            "supabase_url": current_app.supabase.supabase_url if hasattr(current_app, 'supabase') else None,
            "supabase_anon_key": os.getenv('SUPABASE_KEY', '')[:10] + '...' if os.getenv('SUPABASE_KEY') else None
        }

        if enable_auth:
            response["message"] = "Supabase authentication is enabled"
            response["auth_methods"] = ["email/password", "google", "github", "facebook"]
        else:
            response["message"] = "Authentication is disabled (development mode)"

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Auth status error: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error"}), 500

@bp.route('/signup', methods=['POST'])
@security_headers.dev_bypass_rate_limit("5 per minute")
def signup():
    """
    POST /auth/signup
    Register a new user using Supabase Auth
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name', '')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        supabase: Client = current_app.supabase

        # Sign up user with Supabase
        result = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "display_name": full_name or email.split('@')[0]
                }
            }
        })

        if result and hasattr(result, 'user'):
            logger.info(f"User registered successfully: {email}")
            
            # Build response
            response_data = {
                "status": "success",
                "user_id": result.user.id,
                "email": result.user.email
            }
            
            # If Supabase auto-confirmed the email, return the session token for auto-login
            if hasattr(result, 'session') and result.session:
                response_data["access_token"] = result.session.access_token
                response_data["refresh_token"] = result.session.refresh_token
                response_data["expires_in"] = result.session.expires_in
                response_data["message"] = "Account created successfully"
            else:
                # Email confirmation required
                response_data["message"] = "Account created successfully. Please check your email to verify your account."
            
            return jsonify(response_data), 201
        else:
            return jsonify({"error": "Registration failed"}), 400

    except Exception as e:
        logger.error(f"Signup error: {e}", exc_info=True)
        # Handle Supabase specific errors
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            return jsonify({"error": "Email already registered"}), 400
        elif "weak password" in error_msg.lower():
            return jsonify({"error": "Password is too weak"}), 400
        elif "invalid email" in error_msg.lower():
            return jsonify({"error": "Invalid email address"}), 400

        return jsonify({"error": "Registration failed"}), 500

@bp.route('/signin', methods=['POST'])
@security_headers.dev_bypass_rate_limit("10 per minute")
def signin():
    """
    POST /auth/signin
    Authenticate user with email/password
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        supabase: Client = current_app.supabase

        # Sign in user with Supabase
        result = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if result and hasattr(result, 'user') and hasattr(result, 'session'):
            logger.info(f"User signed in successfully: {email}")
            return jsonify({
                "status": "success",
                "message": "Signed in successfully",
                "access_token": result.session.access_token,
                "refresh_token": result.session.refresh_token,
                "user_id": result.user.id,
                "email": result.user.email,
                "full_name": result.user.user_metadata.get('full_name', '') if result.user.user_metadata else '',
                "expires_in": result.session.expires_in
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        logger.error(f"Signin error: {e}", exc_info=True)
        # Handle Supabase specific errors
        error_msg = str(e)
        if "invalid login credentials" in error_msg.lower():
            return jsonify({"error": "Invalid email or password"}), 401
        elif "email not confirmed" in error_msg.lower():
            return jsonify({"error": "Please verify your email address"}), 401

        return jsonify({"error": "Sign in failed"}), 500

@bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    POST /auth/refresh
    Refresh an existing session token
    """
    try:
        data = request.get_json()
        if not data or not data.get('refresh_token'):
            return jsonify({"error": "Refresh token is required"}), 400

        refresh_token = data.get('refresh_token')
        supabase: Client = current_app.supabase

        # Refresh the session
        result = supabase.auth.refresh_session(refresh_token)

        if result and hasattr(result, 'session'):
            logger.info("Token refreshed successfully")
            return jsonify({
                "status": "success",
                "access_token": result.session.access_token,
                "refresh_token": result.session.refresh_token,
                "expires_in": result.session.expires_in
            }), 200
        else:
            return jsonify({"error": "Invalid refresh token"}), 401

    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        return jsonify({"error": "Token refresh failed"}), 401

@bp.route('/signout', methods=['POST'])
def signout():
    """
    POST /auth/signout
    Sign out user and invalidate session
    """
    try:
        # Get the JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401

        jwt_token = auth_header[7:]  # Remove 'Bearer ' prefix
        supabase: Client = current_app.supabase

        # Sign out user with Supabase
        result = supabase.auth.sign_out(jwt_token)

        logger.info("User signed out successfully")
        return jsonify({
            "status": "success",
            "message": "Signed out successfully"
        }), 200

    except Exception as e:
        logger.error(f"Signout error: {e}", exc_info=True)
        return jsonify({"error": "Sign out failed"}), 401

@bp.route('/user', methods=['GET'])
@require_auth
def get_user():
    """
    GET /auth/user
    Get current user information from JWT token
    """
    try:
        user = getattr(request, 'current_user', None)

        if user:
            return jsonify({
                "status": "success",
                "user": {
                    "id": user.get('id'),
                    "email": user.get('email'),
                    "full_name": user.get('user_metadata', {}).get('full_name', ''),
                    "display_name": user.get('user_metadata', {}).get('display_name', user.get('email', '').split('@')[0]),
                    "confirmed_at": user.get('confirmed_at'),
                    "created_at": user.get('created_at'),
                    "aud": user.get('aud'),
                    "role": user.get('role')
                }
            }), 200
        else:
            return jsonify({"error": "Invalid or expired token"}), 401

    except Exception as e:
        logger.error(f"Get user error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get user information"}), 401

@bp.route('/dev-user', methods=['POST'])
def create_dev_user():
    """
    POST /auth/dev-user
    Create or get a development user for testing (development only)
    """
    try:
        # Check if development mode is enabled (TEMPORARILY OVERRIDE FOR TESTING)
        dev_mode = (os.getenv('FLASK_ENV') == 'development' or os.getenv('ENABLE_DEV_USER', 'false').lower() == 'true')

        # TEMPORARY: Force enable for testing if not explicitly production
        if not dev_mode and not os.getenv('PRODUCTION_MODE'):
            dev_mode = True
            logger.info("TEMPORARY: Forcing development mode for testing")

        if not dev_mode:
            return jsonify({"error": "Development user creation is disabled in production"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        user_id = data.get('user_id', 'dev_user')
        display_name = data.get('display_name', user_id)
        dev_email = f"dev_{user_id}@warmth.local"
        dev_password = "dev_user_password_123"

        supabase: Client = current_app.supabase

        # For development, create a mock user without going through Supabase auth
        # This avoids email confirmation issues and spam
        import uuid
        mock_user_id = str(uuid.uuid4())

        logger.info(f"Creating mock development user: {user_id} -> {mock_user_id}")

        # Create a mock JWT token for development (in production, use real Supabase)
        import time
        import jwt as pyjwt

        # Create a simple mock token (this is just for testing)
        mock_payload = {
            'exp': int(time.time() + 3600),  # 1 hour expiry - convert to int
            'sub': mock_user_id,
            'email': f'dev.{user_id}@warmth.dev',
            'aud': 'authenticated',
            'role': 'authenticated',
            'app_metadata': {
                'provider': 'development',
                'is_development_user': True
            },
            'user_metadata': {
                'display_name': display_name,
                'original_user_id': user_id,
                'is_development_user': True
            }
        }

        # Use a simple secret key for development
        mock_secret = 'dev_secret_key_change_in_production'
        mock_token = pyjwt.encode(mock_payload, mock_secret, algorithm='HS256')

        return jsonify({
            "status": "mock_created",
            "message": "Mock development user created for testing",
            "user_id": mock_user_id,
            "email": f'dev.{user_id}@warmth.dev',
            "access_token": mock_token,
            "refresh_token": "mock_refresh_token",
            "display_name": display_name,
            "original_user_id": user_id,
            "is_mock": True
        }), 201

    except Exception as e:
        logger.error(f"Dev user creation error: {e}", exc_info=True)
        return jsonify({"error": "Development user creation failed"}), 500

@bp.route('/config', methods=['GET'])
def auth_config():
    """
    GET /auth/config
    Get Supabase authentication configuration for frontend
    """
    try:
        supabase_url = current_app.supabase.supabase_url if hasattr(current_app, 'supabase') else None
        anon_key = os.getenv('SUPABASE_KEY', '')

        return jsonify({
            "supabase_url": supabase_url,
            "supabase_anon_key": anon_key,
            "enable_auth": os.getenv('ENABLE_AUTH', 'true').lower() == 'true',
            "enable_dev_user": os.getenv('FLASK_ENV') == 'development' or os.getenv('ENABLE_DEV_USER', 'false').lower() == 'true',
            "providers": [
                {"id": "email", "name": "Email", "icon": "email"},
                {"id": "google", "name": "Google", "icon": "google"},
                {"id": "github", "name": "GitHub", "icon": "github"},
                {"id": "facebook", "name": "Facebook", "icon": "facebook"}
            ]
        }), 200

    except Exception as e:
        logger.error(f"Auth config error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get auth configuration"}), 500