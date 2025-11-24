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
        prefs = current_app.memory_repo.get_user_preferences(user_id)
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
        
        success = current_app.memory_repo.set_user_preferences(
            user_id,
            listening_mode=enabled,
            listening_memory_policy=memory_policy,
            listening_tts_muted=tts_muted
        )
        
        if success:
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

