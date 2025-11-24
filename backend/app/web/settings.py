# app/web/settings.py
import logging
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from ..security import require_auth
from .validation import validate_json_request

bp = Blueprint('settings', __name__, url_prefix='/user/settings')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
@require_auth
def get_settings():
    """GET /user/settings - Get user settings"""
    try:
        user_id = request.current_user['id']
        supabase = current_app.supabase
        
        result = supabase.table('user_settings').select('*').eq('user_id', user_id).execute()
        
        if result.data:
            return jsonify(result.data[0]), 200
        
        # Return defaults if no settings exist
        return jsonify({
            'theme': 'light',
            'notifications_enabled': True,
            'sound_enabled': True,
            'haptic_enabled': True
        }), 200
    except Exception as e:
        logger.error(f"Error fetching settings: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch settings"}), 500

@bp.route('/', methods=['PUT'])
@require_auth
def update_settings():
    """PUT /user/settings - Update user settings"""
    try:
        user_id = request.current_user['id']
        data, error, status = validate_json_request()
        if error: return error, status
        
        payload = {
            'user_id': user_id,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Add optional fields
        if 'theme' in data: payload['theme'] = data['theme']
        if 'notifications_enabled' in data: payload['notifications_enabled'] = data['notifications_enabled']
        if 'sound_enabled' in data: payload['sound_enabled'] = data['sound_enabled']
        if 'haptic_enabled' in data: payload['haptic_enabled'] = data['haptic_enabled']
        
        supabase = current_app.supabase
        
        # Upsert settings
        result = supabase.table('user_settings').upsert(payload).execute()
        
        if result.data:
            return jsonify(result.data[0]), 200
        return jsonify({"error": "Failed to update settings"}), 400
    except Exception as e:
        logger.error(f"Error updating settings: {e}", exc_info=True)
        return jsonify({"error": "Failed to update settings"}), 500
