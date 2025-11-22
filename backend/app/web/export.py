# app/web/export.py
"""
Export/Import endpoints for user data
"""
import logging
from flask import Blueprint, request, jsonify, current_app
from ..security import get_current_user_id

bp = Blueprint('export', __name__)
logger = logging.getLogger(__name__)

@bp.route('/export-all', methods=['GET'])
def export_all_data():
    """
    GET /export-all
    Exports all user data (messages, memories, mood logs, etc.)
    """
    try:
        current_user_id = get_current_user_id()
        logger.info(f"Exporting all data for user: {current_user_id}")
        
        supabase = current_app.supabase
        
        # Fetch all data for the user
        data = {}
        
        # Messages
        try:
            messages_result = supabase.table('messages').select('*').eq('user_id', current_user_id).execute()
            data['messages'] = messages_result.data if messages_result.data else []
        except Exception as e:
            logger.warning(f"Failed to fetch messages: {e}")
            data['messages'] = []
        
        # Memories
        try:
            memories_result = supabase.table('memories').select('*').eq('user_id', current_user_id).execute()
            data['memories'] = memories_result.data if memories_result.data else []
        except Exception as e:
            logger.warning(f"Failed to fetch memories: {e}")
            data['memories'] = []
        
        # Mood logs
        try:
            mood_logs_result = supabase.table('mood_logs').select('*').eq('user_id', current_user_id).execute()
            data['mood_logs'] = mood_logs_result.data if mood_logs_result.data else []
        except Exception as e:
            logger.warning(f"Failed to fetch mood logs: {e}")
            data['mood_logs'] = []
        
        # Emotional recaps
        try:
            recaps_result = supabase.table('emotional_recaps').select('*').eq('user_id', current_user_id).execute()
            data['emotional_recaps'] = recaps_result.data if recaps_result.data else []
        except Exception as e:
            logger.warning(f"Failed to fetch emotional recaps: {e}")
            data['emotional_recaps'] = []
        
        logger.info(f"Exported {len(data['messages'])} messages, {len(data['memories'])} memories for user {current_user_id}")
        
        return jsonify(data), 200
        
    except Exception as e:
        logger.error(f"Export all data error: {e}", exc_info=True)
        return jsonify({"error": "Failed to export data"}), 500

@bp.route('/erase-all', methods=['POST'])
def erase_all_data():
    """
    POST /erase-all
    Deletes all user data (messages, memories, mood logs, etc.)
    WARNING: This is irreversible!
    """
    try:
        current_user_id = get_current_user_id()
        logger.warning(f"ERASING ALL DATA for user: {current_user_id}")
        
        supabase = current_app.supabase
        
        # Delete all data for the user
        deleted_counts = {}
        
        # Delete messages
        try:
            supabase.table('messages').delete().eq('user_id', current_user_id).execute()
            deleted_counts['messages'] = 'deleted'
        except Exception as e:
            logger.error(f"Failed to delete messages: {e}")
            deleted_counts['messages'] = 'failed'
        
        # Delete memories
        try:
            supabase.table('memories').delete().eq('user_id', current_user_id).execute()
            deleted_counts['memories'] = 'deleted'
        except Exception as e:
            logger.error(f"Failed to delete memories: {e}")
            deleted_counts['memories'] = 'failed'
        
        # Delete mood logs
        try:
            supabase.table('mood_logs').delete().eq('user_id', current_user_id).execute()
            deleted_counts['mood_logs'] = 'deleted'
        except Exception as e:
            logger.error(f"Failed to delete mood logs: {e}")
            deleted_counts['mood_logs'] = 'failed'
        
        # Delete emotional recaps
        try:
            supabase.table('emotional_recaps').delete().eq('user_id', current_user_id).execute()
            deleted_counts['emotional_recaps'] = 'deleted'
        except Exception as e:
            logger.error(f"Failed to delete emotional recaps: {e}")
            deleted_counts['emotional_recaps'] = 'failed'
        
        logger.info(f"Erase complete for user {current_user_id}: {deleted_counts}")
        
        return jsonify({"status": "success", "deleted": deleted_counts}), 200
        
    except Exception as e:
        logger.error(f"Erase all data error: {e}", exc_info=True)
        return jsonify({"error": "Failed to erase data"}), 500
