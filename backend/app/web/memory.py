# app/web/memory.py
import logging
from flask import Blueprint, request, jsonify, current_app
from ..security import require_auth

bp = Blueprint('memory', __name__, url_prefix='/memory')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET', 'POST'])
@require_auth
def handle_memories():
    """GET: Retrieve memories for the authenticated user.
    POST: Create a new memory entry for the authenticated user.
    """
    user = getattr(request, 'current_user', None)
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not authenticated"}), 401
    user_id = user.get('id')
    supabase = current_app.supabase
    try:
        if request.method == 'GET':
            # Fetch memories for this user
            result = supabase.table('memories').select('*').eq('user_id', user_id).execute()
            if result.error:
                logger.error(f"Supabase GET memories error: {result.error}")
                return jsonify({"error": "Database error", "message": str(result.error)}), 500
            return jsonify({"status": "success", "memories": result.data}), 200
        else:  # POST
            data = request.get_json()
            if not data or 'key' not in data or 'value' not in data:
                return jsonify({"error": "Invalid payload", "message": "'key' and 'value' required"}), 400
            payload = {
                "user_id": user_id,
                "key": data['key'],
                "value": data['value']
            }
            result = supabase.table('memories').insert(payload).execute()
            if result.error:
                logger.error(f"Supabase INSERT memory error: {result.error}")
                return jsonify({"error": "Database error", "message": str(result.error)}), 500
            return jsonify({"status": "created", "memory": result.data[0] if result.data else payload}), 201
    except Exception as e:
        logger.exception("Unexpected error in memory endpoint")
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500