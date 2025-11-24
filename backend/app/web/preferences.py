# app/web/preferences.py
import logging
from flask import Blueprint, jsonify, request, current_app

# Use relative imports
from ..security import csrf_protect, require_auth
from .validation import validate_json_request

bp = Blueprint('preferences', __name__, url_prefix='/preferences')

logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
@require_auth
def get_preferences():
    """ GET /preferences - Gets user preferences. """
    try:
        user_id = request.current_user['id']
        
        # Fetch from Supabase
        result = current_app.supabase.table('user_settings').select('*').eq('user_id', user_id).execute()
        
        if result.data:
            prefs = result.data[0]
        else:
            # Return defaults if no settings found
            prefs = {
                "listening_mode": False,
                "listening_memory_policy": "all",
                "listening_tts_muted": False
            }
            
        return jsonify(prefs), 200
    except Exception as e:
        logger.error(f"Get preferences error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get preferences"}), 500

@bp.route('/listening-mode', methods=['POST'])
@require_auth
def toggle_listening_mode():
    """ POST /preferences/listening-mode - Toggles listening mode. """
    try:
        data, error_response, status_code = validate_json_request()
        if error_response: return error_response, status_code
        
        user_id = request.current_user['id']
        
        enabled = data.get('enabled', False)
        memory_policy = data.get('memory_policy', None)
        tts_muted = data.get('tts_muted', None)
        
        # Prepare update payload
        payload = {
            'user_id': user_id,
            'listening_mode': enabled,
            'updated_at': 'now()'
        }
        
        if memory_policy is not None:
            payload['listening_memory_policy'] = memory_policy
        if tts_muted is not None:
            payload['listening_tts_muted'] = tts_muted
            
        # Upsert to Supabase
        result = current_app.supabase.table('user_settings').upsert(payload).execute()
        
        if result.data:
            logger.info(f"Listening mode {'enabled' if enabled else 'disabled'} for user {user_id}")
            return jsonify({
                "status": "success",
                "listening_mode": enabled
            }), 200
        else:
            return jsonify({"error": "Failed to update preferences"}), 500
            
    except Exception as e:
        logger.error(f"Toggle listening mode error: {e}", exc_info=True)
        return jsonify({"error": "Failed to update preferences"}), 500

