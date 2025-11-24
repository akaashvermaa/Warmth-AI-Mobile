# app/web/main.py
import os
import logging
import hashlib
from datetime import datetime
from flask import (
    Blueprint, 
    request, 
    jsonify, 
    render_template,  
    send_from_directory,
    Response,
    make_response,
    current_app
)

# Use relative imports
from ..security import csrf_protect, require_auth, secure_log_message, generate_csrf_token, get_current_user_id
from ..config import DEFAULT_USER_ID
from .validation import validate_json_request, validate_message

# Import services
# from ..services.whisper_utils import transcribe_audio # Keep this commented out

bp = Blueprint('main', __name__)
logger = logging.getLogger(__name__)

# Cache for rendered templates
_template_cache = {}
def get_template_hash(template_name, **kwargs):
    """Generate hash for template cache key."""
    cache_key = f"{template_name}:{str(sorted(kwargs.items()))}"
    return hashlib.md5(cache_key.encode()).hexdigest()

@bp.route('/transcribe', methods=['POST'])
def transcribe():
    # This route is now disabled
    logger.warning("Attempted to call /transcribe, but Whisper is disabled.")
    return jsonify({"error": "Transcription service is not enabled"}), 503

@bp.route('/')
def home():
    """Serves the main index.html chat UI with caching."""
    try:
        csrf_token = generate_csrf_token() if os.getenv('ENABLE_CSRF', 'false').lower() == 'true' else None
        
        debug_mode = current_app.config.get('FLASK_DEBUG', False)
        cache_key = get_template_hash('index.html', csrf_token=csrf_token)
        
        if not debug_mode and cache_key in _template_cache:
            response = make_response(_template_cache[cache_key])
        else:
            rendered = render_template('index.html', csrf_token=csrf_token)
            if not debug_mode:
                _template_cache[cache_key] = rendered
            response = make_response(rendered)
        
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['ETag'] = f'"{cache_key}"'
        return response, 200
    except Exception as e:
        logger.error(f"Error rendering index.html: {e}", exc_info=True)
        return "Template not found.", 404

@bp.route('/static/<path:path>')
def send_static(path):
    """Serves static files."""
    try:
        return send_from_directory(current_app.static_folder, path)
    except Exception:
        logger.warning(f"Static file not found: {path}")
        return jsonify({"error": "File not found"}), 404

@bp.route('/chat/history', methods=['GET'])
@require_auth
def get_chat_history():
    """
    GET /chat/history
    Retrieves chat history for the authenticated user.
    """
    try:
        # Get current user ID from request context (set by @require_auth)
        current_user_id = request.current_user['id']
        
        limit = request.args.get('limit', 50, type=int)
        
        logger.info(f"Fetching chat history for user: {current_user_id}, limit: {limit}")
        
        # Fetch messages from Supabase
        result = current_app.supabase.table('messages').select('*').eq(
            'user_id', current_user_id
        ).order('created_at', desc=True).limit(limit).execute()
        
        messages = result.data if result.data else []
        
        logger.info(f"Found {len(messages)} messages for user {current_user_id}")
        
        # Reverse to chronological order (oldest first) for the frontend
        messages.reverse()
        
        return jsonify({"messages": messages}), 200
    except Exception as e:
        logger.error(f"GET /chat/history - Error: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch chat history", "details": str(e)}), 500

@bp.route('/chat', methods=['POST'])
@require_auth
def chat():
    """
    POST /chat
    Sends a message to the bot and receives a reply with emotion analysis.
    """
    try:
        data, error_response, status_code = validate_json_request()
        if error_response: return error_response, status_code

        if 'message' not in data:
            return jsonify({"error": "Missing required field: 'message'"}), 400

        user_message = data['message']
        is_valid, error_msg = validate_message(user_message, max_length=5000)
        if not is_valid:
            return jsonify({"error": error_msg}), 400

        secure_log_message(user_message, "info")

        # Set user context in ChatService for authenticated user
        current_user_id = request.current_user['id']
        current_app.chat_service.set_user_context(current_user_id)

        # Use the injected chat_service
        reply = current_app.chat_service.generate_reply(user_message)

        # Analyze emotions in the user's message
        emotion_data = None
        try:
            from ..services.emotion_analysis_service import get_emotion_service
            emotion_service = get_emotion_service()
            
            # Get recent message context for better analysis
            recent_messages = []
            try:
                result = current_app.supabase.table('messages').select('role, content').eq(
                    'user_id', current_user_id
                ).order('created_at', desc=True).limit(5).execute()
                recent_messages = result.data if result.data else []
            except Exception as e:
                logger.warning(f"Failed to get message context: {e}")
            
            # Analyze the message
            emotion_data = emotion_service.analyze_message(user_message, recent_messages)
            
            # Store the message with emotion data in database
            try:
                # 1. Get or create a conversation for today (simple logic for now)
                # In a real app, you might pass conversation_id from frontend
                conversation_id = None
                
                # Try to find recent conversation
                try:
                    recent_conv = current_app.supabase.table('conversations').select('id').eq('user_id', current_user_id).order('updated_at', desc=True).limit(1).execute()
                    if recent_conv.data:
                        conversation_id = recent_conv.data[0]['id']
                except Exception:
                    pass
                
                # Create new if none found
                if not conversation_id:
                    try:
                        new_conv = current_app.supabase.rpc('create_conversation', {'p_title': 'New Conversation'}).execute()
                        conversation_id = new_conv.data
                    except Exception as e:
                        logger.error(f"Failed to create conversation: {e}")

                if conversation_id:
                    # 2. Store USER message using RPC
                    current_app.supabase.rpc('add_message', {
                        'p_conversation_id': conversation_id,
                        'p_role': 'user',
                        'p_content': user_message,
                        'p_emotions': emotion_data.get('emotions') if emotion_data else None,
                        'p_topics': emotion_data.get('topics') if emotion_data else None,
                        'p_sentiment_score': emotion_data.get('sentiment_score') if emotion_data else None
                    }).execute()
                    
                    # 3. Store ASSISTANT message using RPC
                    current_app.supabase.rpc('add_message', {
                        'p_conversation_id': conversation_id,
                        'p_role': 'assistant',
                        'p_content': reply
                    }).execute()
                else:
                    logger.warning("Could not store messages: No conversation ID available")

            except Exception as e:
                logger.error(f"Failed to store messages via RPC: {e}")
                
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}", exc_info=True)
            # Continue without emotion data if analysis fails

        # Return reply with emotion data
        response_data = {"reply": reply}
        if emotion_data and not emotion_data.get('fallback'):
            response_data["emotions"] = emotion_data.get('emotions', [])
            response_data["topics"] = emotion_data.get('topics', [])
            response_data["sentiment_score"] = emotion_data.get('sentiment_score', 0)

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"POST /chat - 500 Internal Server Error: {e}", exc_info=True)
        raise


@bp.route('/chat/stream', methods=['POST'])
@require_auth
def chat_stream():
    """
    POST /chat/stream
    Sends a message to the bot and streams the reply token by token.
    """
    from flask import Response
    import json

    # Validate request data before entering generator
    data, error_response, status_code = validate_json_request()
    if error_response:
        return Response(f"data: {json.dumps({'error': 'Validation failed'})}\n\n", mimetype='text/plain'), 400

    if 'message' not in data:
        return Response(f"data: {json.dumps({'error': 'Missing required field: message'})}\n\n", mimetype='text/plain'), 400

    user_message = data['message']
    is_valid, error_msg = validate_message(user_message, max_length=5000)
    if not is_valid:
        return Response(f"data: {json.dumps({'error': error_msg})}\n\n", mimetype='text/plain'), 400

    secure_log_message(user_message, "info")

    # Set user context in ChatService for authenticated user
    current_user_id = request.current_user['id']
    current_app.chat_service.set_user_context(current_user_id)

    # Pre-build messages and get chat_service reference outside generator
    chat_service = current_app.chat_service
    messages = [
        {"role": "system", "content": chat_service._build_prompt(
            chat_service._sanitize_memory_for_prompt("None"),
            0.0  # neutral mood for streaming
        )},
        {"role": "user", "content": user_message}
    ]

    def generate():
        try:
            # Stream the response
            for token in chat_service.chat_stream(messages):
                yield f"data: {json.dumps({'token': token})}\n\n"

            # Signal completion
            yield f"data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"POST /chat/stream - Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': 'Streaming failed'})}\n\n"

    return Response(generate(), mimetype='text/plain')

@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({"status": "healthy", "service": "warmth"}), 200