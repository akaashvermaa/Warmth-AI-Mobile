"""
Security headers and rate limiting configuration
"""
import os
from flask import Flask, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps


def init_security_headers(app: Flask):
    """Initialize security headers for the Flask application"""

    @app.after_request
    def security_headers(response):
        """Add security headers to all responses"""

        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Content Security Policy (CSP)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https://kvdrnoctdtqzwdcsjcvy.supabase.co; "
            "frame-ancestors 'none'; "
            "form-action 'self';"
        )
        response.headers['Content-Security-Policy'] = csp

        # HSTS (only in production)
        if os.getenv('FLASK_ENV') != 'development':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Permissions Policy
        permissions_policy = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
        response.headers['Permissions-Policy'] = permissions_policy

        return response


# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    headers_enabled=True
)


def init_rate_limiting(app: Flask):
    """Initialize rate limiting for the Flask application"""
    limiter.init_app(app)


def rate_limit(limit: str):
    """Decorator to apply custom rate limits to endpoints"""
    return limiter.limit(limit)


def conditional_rate_limit(limit: str, condition_func=None):
    """
    Decorator to apply rate limits conditionally

    Args:
        limit: Rate limit string (e.g., "10 per minute")
        condition_func: Function that returns True if rate limit should be applied
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if condition_func and not condition_func():
                # Skip rate limiting if condition is False
                return f(*args, **kwargs)

            # Apply rate limiting
            return limiter.limit(limit)(f)(*args, **kwargs)
        return decorated_function
    return decorator


def api_key_required(f):
    """Decorator to require API key for certain endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        expected_key = os.getenv('API_KEY')

        if not expected_key:
            # API key protection disabled
            return f(*args, **kwargs)

        if not api_key or api_key != expected_key:
            return {'error': 'Invalid or missing API key'}, 401

        return f(*args, **kwargs)
    return decorated_function


# Development mode bypass
def is_production():
    """Check if running in production mode"""
    return os.getenv('FLASK_ENV') != 'development'


def dev_bypass_rate_limit(limit: str):
    """Rate limit decorator that bypasses limits in development"""
    return conditional_rate_limit(limit, lambda: is_production())