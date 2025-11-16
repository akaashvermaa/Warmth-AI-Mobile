# app/web/auth.py
"""
Supabase Authentication endpoints for Warmth AI
Provides JWT-based authentication using Supabase Auth
"""
import os
import logging
from flask import Blueprint, request, jsonify, current_app
from supabase import Client

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
            return jsonify({
                "status": "success",
                "message": "Account created successfully. Please check your email to verify your account.",
                "user_id": result.user.id,
                "email": result.user.email
            }), 201
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
def get_user():
    """
    GET /auth/user
    Get current user information from JWT token
    """
    try:
        # Get the JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401

        jwt_token = auth_header[7:]  # Remove 'Bearer ' prefix
        supabase: Client = current_app.supabase

        # Get user from JWT
        user = supabase.auth.get_user(jwt_token)

        if user and hasattr(user, 'user'):
            return jsonify({
                "status": "success",
                "user": {
                    "id": user.user.id,
                    "email": user.user.email,
                    "full_name": user.user.user_metadata.get('full_name', '') if user.user.user_metadata else '',
                    "display_name": user.user.user_metadata.get('display_name', user.user.email.split('@')[0]) if user.user.user_metadata else user.user.email.split('@')[0],
                    "confirmed_at": str(user.user.confirmed_at) if user.user.confirmed_at else None,
                    "created_at": str(user.user.created_at) if user.user.created_at else None,
                    "aud": user.user.aud,
                    "role": user.user.role
                }
            }), 200
        else:
            return jsonify({"error": "Invalid or expired token"}), 401

    except Exception as e:
        logger.error(f"Get user error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get user information"}), 401

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