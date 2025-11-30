# app/web/mood.py
import logging
import json
from flask import Blueprint, jsonify, request, Response, current_app
from datetime import datetime, timedelta

from ..security import csrf_protect, require_auth, encrypt_data, decrypt_data
from .validation import validate_json_request

bp = Blueprint('mood', __name__)
logger = logging.getLogger(__name__)

# === Add missing mood endpoints ===
@bp.route('/mood', methods=['POST'])
@require_auth
def log_mood():
    """ POST /mood - Logs a mood entry. """
    try:
        data, error_response, status_code = validate_json_request()
        if error_response:
            return error_response, status_code

        score = data.get('score')
        label = data.get('label', 'Neutral')
        topic = data.get('topic', 'General')
        
        if score is None:
            return jsonify({"error": "Missing score"}), 400

        # Get current user ID from request context (set by @require_auth)
        user_id = request.current_user['id']
        
        # Insert into Supabase
        payload = {
            'user_id': user_id,
            'score': float(score),
            'label': label,
            'topic': topic,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        result = current_app.supabase.table('mood_logs').insert(payload).execute()
        
        if result.data:
            logger.info(f"Mood logged: {score} for user {user_id}")
            return jsonify({"success": True, "message": "Mood logged successfully", "entry": result.data[0]}), 201
        else:
            logger.error("Supabase insert returned no data")
            return jsonify({"error": "Failed to save mood"}), 500

    except Exception as e:
        logger.error(f"POST /mood - 500 Internal Server Error: {e}", exc_info=True)
        return jsonify({"error": "Failed to log mood"}), 500

@bp.route('/mood_logs', methods=['GET'])
@require_auth
def get_mood_logs():
    """ GET /mood_logs - Retrieves mood history for the graph. """
    try:
        # Use global Supabase client
        supabase = current_app.supabase
        
        # Get current user ID
        user_id = request.current_user['id']
        logger.info(f"Fetching mood logs for user_id: {user_id}")

        # Get mood history from last 30 days (extended for graph)
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
        result = supabase.table('mood_logs').select('*').eq('user_id', user_id).gte('timestamp', cutoff_date).order('timestamp', desc=True).execute()
        history = result.data if result.data else []
        
        logger.info(f"Found {len(history)} mood entries for user {user_id}")

        return jsonify({
            "mood_logs": history
        }), 200
    except Exception as e:
        logger.error(f"GET /mood_logs - 500 Internal Server Error: {e}", exc_info=True)
        return jsonify({"mood_logs": []}), 200

@bp.route('/export/mood-history', methods=['GET'])
@require_auth
def export_mood_history():
    """ GET /export/mood-history - Exports mood history as encrypted JSON. """
    try:
        password = request.args.get('password', None)
        user_id = request.current_user['id']
        
        def _export_task():
            supabase = current_app.supabase
            
            # Get mood history
            mood_result = supabase.table('mood_logs').select('*').eq('user_id', user_id).execute()
            history = mood_result.data if mood_result.data else []
            
            # Get memories
            memories_result = supabase.table('memories').select('*').eq('user_id', user_id).execute()
            memories = memories_result.data if memories_result.data else []
            
            export_data = {
                "mood_history": history,
                "memories": memories,
                "export_timestamp": datetime.utcnow().isoformat()
            }
            json_data = json.dumps(export_data, indent=2)
            encrypted_data = encrypt_data(json_data, password)
            return encrypted_data
        
        # Use the executor from the chat_service (which gets it from llm_service)
        future = current_app.chat_service.llm_service.heavy_executor.submit(_export_task)
        encrypted_data = future.result(timeout=30)
        
        response = Response(
            encrypted_data,
            mimetype='application/octet-stream',
            headers={
                'Content-Disposition': 'attachment; filename=warmth_export_encrypted.txt',
                'X-Export-Format': 'encrypted',
                'X-Password-Required': 'true' if password else 'false'
            }
        )
        logger.info(f"Mood history exported (encrypted) for user {user_id}")
        return response, 200
        
    except Exception as e:
        logger.error(f"Export error: {e}", exc_info=True)
        return jsonify({"error": "Export failed"}), 500

@bp.route('/export/mood-history/decrypt', methods=['POST'])
@require_auth
def decrypt_export():
    """ POST /export/mood-history/decrypt - Decrypts exported data. """
    try:
        data, error_response, status_code = validate_json_request()
        if error_response: return error_response, status_code
        
        encrypted_data = data.get('encrypted_data')
        password = data.get('password')
        
        if not encrypted_data or not password:
            return jsonify({"error": "Missing encrypted_data or password"}), 400
        
        decrypted_data = decrypt_data(encrypted_data, password)
        
        return jsonify({"status": "success", "data": decrypted_data}), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Decrypt error: {e}", exc_info=True)
        return jsonify({"error": "Decryption failed"}), 500