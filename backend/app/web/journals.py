# app/web/journals.py
import logging
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from ..security import require_auth
from .validation import validate_json_request

bp = Blueprint('journals', __name__, url_prefix='/journals')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
@require_auth
def get_journals():
    """GET /journals - List all journals for current user"""
    try:
        user_id = request.current_user['id']
        supabase = current_app.supabase
        
        result = supabase.table('journals').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return jsonify(result.data), 200
    except Exception as e:
        logger.error(f"Error fetching journals: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch journals"}), 500

@bp.route('/', methods=['POST'])
@require_auth
def create_journal():
    """POST /journals - Create a new journal"""
    try:
        user_id = request.current_user['id']
        data, error, status = validate_json_request()
        if error: return error, status
        
        payload = {
            'user_id': user_id,
            'title': data.get('title', 'Untitled'),
            'content': data.get('content', ''),
            'mood_score': data.get('mood_score'),
            'tags': data.get('tags', []),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase = current_app.supabase
        result = supabase.table('journals').insert(payload).execute()
        
        if result.data:
            return jsonify(result.data[0]), 201
        return jsonify({"error": "Failed to create journal"}), 400
    except Exception as e:
        logger.error(f"Error creating journal: {e}", exc_info=True)
        return jsonify({"error": "Failed to create journal"}), 500

@bp.route('/<journal_id>', methods=['PUT'])
@require_auth
def update_journal(journal_id):
    """PUT /journals/<id> - Update a journal"""
    try:
        user_id = request.current_user['id']
        data, error, status = validate_json_request()
        if error: return error, status
        
        payload = {
            'title': data.get('title'),
            'content': data.get('content'),
            'mood_score': data.get('mood_score'),
            'tags': data.get('tags'),
            'updated_at': datetime.utcnow().isoformat()
        }
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        supabase = current_app.supabase
        result = supabase.table('journals').update(payload).eq('id', journal_id).eq('user_id', user_id).execute()
        
        if result.data:
            return jsonify(result.data[0]), 200
        return jsonify({"error": "Journal not found or update failed"}), 404
    except Exception as e:
        logger.error(f"Error updating journal: {e}", exc_info=True)
        return jsonify({"error": "Failed to update journal"}), 500

@bp.route('/<journal_id>', methods=['DELETE'])
@require_auth
def delete_journal(journal_id):
    """DELETE /journals/<id> - Delete a journal"""
    try:
        user_id = request.current_user['id']
        supabase = current_app.supabase
        
        result = supabase.table('journals').delete().eq('id', journal_id).eq('user_id', user_id).execute()
        
        if result.data:
            return jsonify({"message": "Journal deleted"}), 200
        return jsonify({"error": "Journal not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting journal: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete journal"}), 500
