# app/web/journal_entries.py
import logging
from flask import Blueprint, request, jsonify, current_app
from ..security import require_auth

bp = Blueprint('journal_entries', __name__)
logger = logging.getLogger(__name__)

@bp.route('/journal_entries', methods=['GET'])
@require_auth
def get_journal_entries():
    """ GET /journal_entries - Retrieves combined memories and mood logs sorted by timestamp. """
    try:
        user_id = request.current_user['id']
        supabase = current_app.supabase
        
        # Get memories
        memories_result = supabase.table('memories').select('*').eq('user_id', user_id).execute()
        memories = memories_result.data if memories_result.data else []
        
        # Get mood logs
        mood_result = supabase.table('mood_logs').select('*').eq('user_id', user_id).execute()
        mood_history = mood_result.data if mood_result.data else []

        # Create combined journal entries
        journal_entries = []

        # Process memories
        for memory in memories:
            journal_entries.append({
                'id': memory['id'],
                'type': 'memory',
                'key': memory['key'],
                'value': memory['value'],
                'timestamp': memory['timestamp'],
                'importance': memory.get('importance', 0.5)
            })

        # Process mood logs
        for mood in mood_history:
            journal_entries.append({
                'id': f"mood_{mood['id']}",
                'type': 'mood',
                'score': mood['score'],
                'label': mood.get('label', 'Neutral'),
                'topic': mood.get('topic'),
                'timestamp': mood['timestamp'],
                'count': 1
            })

        # Sort all entries by timestamp (descending - newest first)
        journal_entries.sort(key=lambda x: x['timestamp'], reverse=True)

        return jsonify({
            'entries': journal_entries
        }), 200

    except Exception as e:
        logger.error(f"GET /journal_entries - 500 Internal Server Error: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch journal entries"}), 500
