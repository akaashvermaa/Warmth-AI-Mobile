-- ==========================================
-- PHASE 5: Server-Side RPC Functions
-- ==========================================

-- 5.1: Enhanced Home Payload Function
-- Returns comprehensive user data in a single call
CREATE OR REPLACE FUNCTION get_home_payload()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Verify user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'profile', (
            SELECT to_jsonb(u.*) 
            FROM public.users u 
            WHERE u.id = v_user_id
        ),
        'preferences', (
            SELECT to_jsonb(s.*) 
            FROM public.user_settings s 
            WHERE s.user_id = v_user_id
        ),
        'recent_conversations', (
            SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb)
            FROM (
                SELECT id, title, is_pinned, updated_at 
                FROM public.conversations 
                WHERE user_id = v_user_id 
                ORDER BY updated_at DESC 
                LIMIT 5
            ) c
        ),
        'mood_summary', (
            SELECT jsonb_build_object(
                'average_7d', ROUND(AVG(score)::numeric, 2),
                'count_7d', COUNT(*),
                'latest_score', (SELECT score FROM public.mood_logs WHERE user_id = v_user_id ORDER BY created_at DESC LIMIT 1),
                'latest_date', (SELECT created_at FROM public.mood_logs WHERE user_id = v_user_id ORDER BY created_at DESC LIMIT 1)
            )
            FROM public.mood_logs 
            WHERE user_id = v_user_id 
            AND created_at > now() - interval '7 days'
        ),
        'memory_stats', (
            SELECT jsonb_build_object(
                'total_memories', COUNT(*),
                'embedded_count', COUNT(*) FILTER (WHERE embedding_state = 'embedded'),
                'pending_count', COUNT(*) FILTER (WHERE embedding_state = 'pending')
            )
            FROM public.memories
            WHERE user_id = v_user_id
        ),
        'latest_recap', (
            SELECT to_jsonb(r.*)
            FROM public.emotional_recaps r
            WHERE r.user_id = v_user_id
            ORDER BY created_at DESC
            LIMIT 1
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2: Enhanced Message Append Function
-- Validates conversation ownership and updates conversation timestamp
CREATE OR REPLACE FUNCTION append_message(
    p_conversation_id UUID,
    p_role TEXT,
    p_content TEXT,
    p_emotions JSONB DEFAULT NULL,
    p_topics TEXT[] DEFAULT NULL,
    p_sentiment_score FLOAT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_message_id UUID;
    v_conversation_exists BOOLEAN;
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify conversation ownership
    SELECT EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = p_conversation_id AND user_id = v_user_id
    ) INTO v_conversation_exists;

    IF NOT v_conversation_exists THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Validate role
    IF p_role NOT IN ('user', 'assistant', 'system') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    -- Insert message
    INSERT INTO public.messages (
        user_id, conversation_id, role, content, 
        emotions, topics, sentiment_score
    )
    VALUES (
        v_user_id, p_conversation_id, p_role, p_content,
        p_emotions, p_topics, p_sentiment_score
    )
    RETURNING id INTO v_message_id;

    -- Update conversation timestamp
    UPDATE public.conversations 
    SET updated_at = now() 
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3: Store Memory and Queue Embedding
-- Atomically stores memory and marks for embedding
CREATE OR REPLACE FUNCTION store_memory_and_queue(
    p_content TEXT,
    p_importance FLOAT DEFAULT 0.5
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_memory_id UUID;
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate importance
    IF p_importance < 0 OR p_importance > 1 THEN
        RAISE EXCEPTION 'Importance must be between 0 and 1';
    END IF;

    -- Insert memory with pending state
    INSERT INTO public.memories (user_id, content, importance, embedding_state)
    VALUES (v_user_id, p_content, p_importance, 'pending')
    RETURNING id INTO v_memory_id;

    RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4: Fetch Memories by Similarity (Enhanced)
-- Returns memories with similarity score, filtered by user
CREATE OR REPLACE FUNCTION fetch_memories_by_similarity(
    p_query_embedding vector(1536),
    p_match_threshold FLOAT DEFAULT 0.7,
    p_match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    importance FLOAT,
    similarity FLOAT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.importance,
        1 - (me.embedding <=> p_query_embedding) AS similarity,
        m.created_at
    FROM public.memories m
    JOIN public.memory_embeddings me ON m.id = me.memory_id
    WHERE m.user_id = v_user_id
    AND m.embedding_state = 'embedded'
    AND 1 - (me.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY similarity DESC
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5: Log Memory Access with Validation
CREATE OR REPLACE FUNCTION log_memory_access(
    p_memory_id UUID,
    p_access_type TEXT,
    p_relevance_score FLOAT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_memory_exists BOOLEAN;
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify memory ownership
    SELECT EXISTS (
        SELECT 1 FROM public.memories 
        WHERE id = p_memory_id AND user_id = v_user_id
    ) INTO v_memory_exists;

    IF NOT v_memory_exists THEN
        RAISE EXCEPTION 'Memory not found or access denied';
    END IF;

    -- Validate access type
    IF p_access_type NOT IN ('retrieval', 'update', 'delete', 'export', 'search') THEN
        RAISE EXCEPTION 'Invalid access_type: %', p_access_type;
    END IF;

    -- Log access
    INSERT INTO public.memory_access_log (user_id, memory_id, access_type, relevance_score)
    VALUES (v_user_id, p_memory_id, p_access_type, p_relevance_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6: Update User Preferences (Enhanced)
CREATE OR REPLACE FUNCTION update_user_preferences(p_settings JSONB)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Upsert preferences
    INSERT INTO public.user_settings (
        user_id,
        theme,
        notifications_enabled,
        sound_enabled,
        haptic_enabled,
        listening_mode,
        tts_settings,
        memory_policy
    )
    VALUES (
        v_user_id,
        COALESCE(p_settings->>'theme', 'light'),
        COALESCE((p_settings->>'notifications_enabled')::boolean, true),
        COALESCE((p_settings->>'sound_enabled')::boolean, true),
        COALESCE((p_settings->>'haptic_enabled')::boolean, true),
        COALESCE((p_settings->>'listening_mode')::boolean, false),
        COALESCE((p_settings->'tts_settings')::jsonb, '{"voice": "alloy", "speed": 1.0}'::jsonb),
        COALESCE((p_settings->'memory_policy')::jsonb, '{"auto_save": true, "retention_days": 365}'::jsonb)
    )
    ON CONFLICT (user_id) DO UPDATE SET
        theme = COALESCE(p_settings->>'theme', user_settings.theme),
        notifications_enabled = COALESCE((p_settings->>'notifications_enabled')::boolean, user_settings.notifications_enabled),
        sound_enabled = COALESCE((p_settings->>'sound_enabled')::boolean, user_settings.sound_enabled),
        haptic_enabled = COALESCE((p_settings->>'haptic_enabled')::boolean, user_settings.haptic_enabled),
        listening_mode = COALESCE((p_settings->>'listening_mode')::boolean, user_settings.listening_mode),
        tts_settings = COALESCE((p_settings->'tts_settings')::jsonb, user_settings.tts_settings),
        memory_policy = COALESCE((p_settings->'memory_policy')::jsonb, user_settings.memory_policy),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.7: Get Conversation with Messages
-- Returns conversation details with all messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(p_conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
    v_conversation_exists BOOLEAN;
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify conversation ownership
    SELECT EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = p_conversation_id AND user_id = v_user_id
    ) INTO v_conversation_exists;

    IF NOT v_conversation_exists THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Build result
    SELECT jsonb_build_object(
        'conversation', (
            SELECT to_jsonb(c.*) 
            FROM public.conversations c 
            WHERE c.id = p_conversation_id
        ),
        'messages', (
            SELECT COALESCE(jsonb_agg(m.* ORDER BY m.created_at ASC), '[]'::jsonb)
            FROM public.messages m
            WHERE m.conversation_id = p_conversation_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 5 Complete
-- Summary:
-- ✅ Enhanced get_home_payload with comprehensive user data
-- ✅ Created append_message with validation and ownership checks
-- ✅ Created store_memory_and_queue for atomic memory creation
-- ✅ Enhanced fetch_memories_by_similarity with filtering
-- ✅ Added log_memory_access with validation
-- ✅ Enhanced update_user_preferences with upsert logic
-- ✅ Created get_conversation_with_messages helper
-- ✅ All functions enforce auth.uid() - no client-supplied user_id
