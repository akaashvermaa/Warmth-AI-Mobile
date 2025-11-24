# app/web/insights.py
import logging
from flask import Blueprint, jsonify, current_app, request
from datetime import datetime, timedelta
from ..security import require_auth
from ..services.emotion_analysis_service import get_emotion_service

bp = Blueprint('insights', __name__, url_prefix='/insights')
logger = logging.getLogger(__name__)

@bp.route('/recap/check', methods=['GET'])
@require_auth
def check_recap_status():
    """
    GET /insights/recap/check
    Check if a new 3-day recap is available for the user.
    """
    try:
        user = getattr(request, 'current_user', None)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = user.get('id')
        supabase = current_app.supabase
        
        # Check if there's an unviewed recap
        result = supabase.table('emotional_recaps').select('*').eq(
            'user_id', user_id
        ).eq('viewed', False).order('created_at', desc=True).limit(1).execute()
        
        if result.data:
            return jsonify({
                "has_new_recap": True,
                "recap_id": result.data[0]['id'],
                "created_at": result.data[0]['created_at']
            }), 200
        
        # Check if user needs a new recap (using database function)
        try:
            # Call the database function
            result = supabase.rpc('needs_new_recap', {'p_user_id': user_id}).execute()
            needs_recap = result.data if result.data else False
            
            return jsonify({
                "has_new_recap": False,
                "needs_generation": needs_recap
            }), 200
        except Exception as e:
            logger.warning(f"Failed to check recap status: {e}")
            return jsonify({
                "has_new_recap": False,
                "needs_generation": False
            }), 200
            
    except Exception as e:
        logger.error(f"GET /insights/recap/check error: {e}", exc_info=True)
        return jsonify({"error": f"Failed to check recap status: {str(e)}"}), 500

@bp.route('/recap/latest', methods=['GET'])
@require_auth
def get_latest_recap():
    """
    GET /insights/recap/latest
    Get the latest 3-day emotional recap for the user.
    """
    try:
        # Get current user ID from request context (set by @require_auth)
        user_id = request.current_user['id']
        
        supabase = current_app.supabase
        
        # Get the latest recap
        result = supabase.table('emotional_recaps').select('*').eq(
            'user_id', user_id
        ).order('created_at', desc=True).limit(1).execute()
        
        if not result.data:
            return jsonify({"error": "No recap available"}), 404
        
        recap = result.data[0]
        
        # Mark as viewed
        try:
            supabase.table('emotional_recaps').update({
                'viewed': True
            }).eq('id', recap['id']).execute()
        except Exception as e:
            logger.warning(f"Failed to mark recap as viewed: {e}")
        
        return jsonify({
            "recap": {
                "id": recap['id'],
                "headline": recap['headline'],
                "narrative": recap['narrative'],
                "top_emotions": recap['top_emotions'],
                "key_topics": recap['key_topics'],
                "recommendations": recap['recommendations'],
                "start_date": recap['start_date'],
                "end_date": recap['end_date'],
                "created_at": recap['created_at']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"GET /insights/recap/latest error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get recap"}), 500

@bp.route('/recap/generate', methods=['POST'])
@require_auth
def generate_recap():
    """
    POST /insights/recap/generate
    Generate a new 3-day emotional recap for the user.
    """
    try:
        user = getattr(request, 'current_user', None)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = user.get('id')
        supabase = current_app.supabase
        emotion_service = get_emotion_service()
        
        # Get messages from the last 3 days
        three_days_ago = (datetime.utcnow() - timedelta(days=3)).isoformat()
        result = supabase.table('messages').select('*').eq(
            'user_id', user_id
        ).gte('created_at', three_days_ago).order('created_at', desc=True).execute()
        
        if not result.data or len(result.data) < 3:
            return jsonify({"error": "Not enough messages for a recap"}), 400
        
        # Generate the recap
        recap_data = emotion_service.generate_3day_recap(result.data, user_id)
        
        # Store the recap
        stored_recap = supabase.table('emotional_recaps').insert({
            'user_id': user_id,
            'start_date': recap_data['start_date'],
            'end_date': recap_data['end_date'],
            'headline': recap_data['headline'],
            'narrative': recap_data['narrative'],
            'top_emotions': recap_data['top_emotions'],
            'key_topics': recap_data['key_topics'],
            'recommendations': recap_data['recommendations'],
            'viewed': False
        }).execute()
        
        if not stored_recap.data:
            return jsonify({"error": "Failed to store recap"}), 500
        
        return jsonify({
            "recap": {
                "id": stored_recap.data[0]['id'],
                "headline": recap_data['headline'],
                "narrative": recap_data['narrative'],
                "top_emotions": recap_data['top_emotions'],
                "key_topics": recap_data['key_topics'],
                "recommendations": recap_data['recommendations'],
                "created_at": stored_recap.data[0]['created_at']
            }
        }), 201
        
    except Exception as e:
        logger.error(f"POST /insights/recap/generate error: {e}", exc_info=True)
        return jsonify({"error": f"Failed to generate recap: {str(e)}"}), 500

@bp.route('/memory-graph', methods=['GET'])
@require_auth
def get_memory_graph():
    """
    GET /insights/memory-graph
    Get the user's memory graph (recurring topics and snippets).
    """
    try:
        user = getattr(request, 'current_user', None)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = user.get('id')
        supabase = current_app.supabase
        emotion_service = get_emotion_service()
        
        # Fetch all user messages (limit to last 1000 for performance)
        result = supabase.table('messages').select('*').eq(
            'user_id', user_id
        ).order('created_at', desc=True).limit(1000).execute()
        
        if not result.data:
            return jsonify({"memories": []}), 200
            
        # Generate memory graph
        # Reverse to chronological order for analysis
        messages = result.data[::-1]
        memory_data = emotion_service.get_memory_graph(messages, user_id)
        
        return jsonify(memory_data), 200
        
    except Exception as e:
        logger.error(f"GET /insights/memory-graph error: {e}", exc_info=True)
        return jsonify({"error": "Failed to get memory graph"}), 500
