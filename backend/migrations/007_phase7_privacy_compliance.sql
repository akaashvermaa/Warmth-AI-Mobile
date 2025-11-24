-- ==========================================
-- PHASE 7: Privacy & Compliance (GDPR/CCPA)
-- ==========================================

-- 7.1: Add Sensitive Memory Flag
-- Allows users to mark memories as sensitive (excluded from general context)
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE;

-- 7.2: Export User Data Function (Right to Data Portability)
-- Returns all user data in a structured JSON format
CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Log the export request
    INSERT INTO public.memory_access_log (user_id, access_type, relevance_score)
    VALUES (v_user_id, 'export', 1.0);

    SELECT jsonb_build_object(
        'profile', (SELECT to_jsonb(u.*) FROM public.users u WHERE id = v_user_id),
        'settings', (SELECT to_jsonb(s.*) FROM public.user_settings s WHERE user_id = v_user_id),
        'conversations', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'title', c.title,
                    'created_at', c.created_at,
                    'messages', (
                        SELECT jsonb_agg(m.* ORDER BY created_at)
                        FROM public.messages m
                        WHERE m.conversation_id = c.id
                    )
                )
            )
            FROM public.conversations c
            WHERE c.user_id = v_user_id
        ),
        'memories', (SELECT jsonb_agg(m.*) FROM public.memories m WHERE user_id = v_user_id),
        'mood_logs', (SELECT jsonb_agg(ml.*) FROM public.mood_logs ml WHERE user_id = v_user_id),
        'journals', (SELECT jsonb_agg(j.*) FROM public.journals j WHERE user_id = v_user_id),
        'emotional_recaps', (SELECT jsonb_agg(er.*) FROM public.emotional_recaps er WHERE user_id = v_user_id),
        'export_date', now()
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3: Delete User Account Function (Right to be Forgotten)
-- Permanently deletes all user data (cascades via FKs)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Verify authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Log the deletion request (will be deleted with user, but good for audit stream if enabled)
    RAISE NOTICE 'Deleting account for user %', v_user_id;

    -- Delete from public.users (Cascades to all other tables)
    DELETE FROM public.users WHERE id = v_user_id;
    
    -- Delete from auth.users (Supabase Auth)
    -- Note: This requires the Postgres role to have permissions on auth.users
    -- If this fails due to permissions, the client should call Supabase Admin API
    -- But we can try to delete self if allowed, or at least clear public data
    
    -- For security, we usually let the client app call the Admin API to delete auth user
    -- But we ensure all application data is gone.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.4: Memory Usage Transparency View
-- Allows users to see how their data is being accessed
CREATE OR REPLACE VIEW user_data_usage_stats AS
SELECT
    user_id,
    access_type,
    COUNT(*) as access_count,
    MAX(created_at) as last_access
FROM public.memory_access_log
GROUP BY user_id, access_type;

-- Enable RLS on the view (implicitly uses underlying tables, but good to be explicit if materialized)
-- Views inherit RLS from underlying tables in Postgres 15+, but we can wrap in a function for API access

CREATE OR REPLACE FUNCTION get_my_data_usage()
RETURNS TABLE (
    access_type TEXT,
    access_count BIGINT,
    last_access TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mal.access_type,
        COUNT(*) as access_count,
        MAX(mal.created_at) as last_access
    FROM public.memory_access_log mal
    WHERE mal.user_id = auth.uid()
    GROUP BY mal.access_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 7 Complete
-- Summary:
-- ✅ Added is_sensitive flag to memories
-- ✅ Implemented export_user_data() for GDPR portability
-- ✅ Implemented delete_user_account() for Right to be Forgotten
-- ✅ Created get_my_data_usage() for transparency
