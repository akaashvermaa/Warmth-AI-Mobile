-- Fix RPC Conflict: Drop all variations of add_message and recreate one
DROP FUNCTION IF EXISTS public.add_message(uuid, text, text, jsonb, jsonb, double precision);
DROP FUNCTION IF EXISTS public.add_message(uuid, text, text, jsonb, text[], double precision);

-- Recreate add_message with correct signature and user_id handling
CREATE OR REPLACE FUNCTION public.add_message(
    p_conversation_id UUID,
    p_role TEXT,
    p_content TEXT,
    p_emotions JSONB DEFAULT NULL,
    p_topics JSONB DEFAULT NULL,
    p_sentiment_score FLOAT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_user_id UUID;
BEGIN
    -- Get user_id from authenticated session
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        -- Fallback for testing/service role if needed, but preferably should be authenticated
        -- You can remove this check if you want to allow anon inserts (not recommended)
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO messages (
        conversation_id,
        user_id,
        role,
        content,
        emotions,
        topics,
        sentiment_score
    ) VALUES (
        p_conversation_id,
        v_user_id,
        p_role,
        p_content,
        p_emotions,
        p_topics,
        p_sentiment_score
    ) RETURNING id INTO v_message_id;

    -- Update conversation updated_at
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix User Settings Schema
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS listening_memory_policy INTEGER DEFAULT 0;

-- Fix Mood Logs Schema
ALTER TABLE public.mood_logs 
ADD COLUMN IF NOT EXISTS label TEXT;

-- Handle timestamp vs created_at in mood_logs
-- If created_at exists, we can create a generated column or alias, 
-- but for now let's ensure created_at exists and the code should use that.
-- However, the code asks for 'timestamp'. Let's add it as an alias if needed, 
-- or better, update the code. But since I can't update code right now without redeploy,
-- I will add 'timestamp' column as a generated column if possible, or just a regular column.
ALTER TABLE public.mood_logs 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Backfill timestamp from created_at if it was empty and created_at exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mood_logs' AND column_name = 'created_at') THEN
        UPDATE public.mood_logs SET timestamp = created_at WHERE timestamp IS NULL;
    END IF;
END $$;
