-- ==========================================
-- PHASE 1: Identity & Data Integrity Hardening
-- ==========================================

-- 1.1: Remove duplicate email from public.users
-- Decision: Drop email column, read from auth.users via JOIN
-- Rationale: Single source of truth, no sync issues
ALTER TABLE public.users DROP COLUMN IF EXISTS email;

-- 1.2: Add CHECK constraint for access_type enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_access_type' 
        AND conrelid = 'public.memory_access_log'::regclass
    ) THEN
        ALTER TABLE public.memory_access_log
        ADD CONSTRAINT check_access_type
        CHECK (access_type IN ('retrieval', 'update', 'delete', 'export', 'search'));
    END IF;
END $$;

-- 1.3: Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.4: Apply updated_at triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emotional_recaps_updated_at ON public.emotional_recaps;
CREATE TRIGGER update_emotional_recaps_updated_at
BEFORE UPDATE ON public.emotional_recaps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mood_patterns_updated_at ON public.mood_patterns;
CREATE TRIGGER update_mood_patterns_updated_at
BEFORE UPDATE ON public.mood_patterns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journals_updated_at ON public.journals;
CREATE TRIGGER update_journals_updated_at
BEFORE UPDATE ON public.journals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 1.5: Add cross-table consistency validation for memory_embeddings
-- Ensure memory_embeddings.user_id matches memories.user_id
CREATE OR REPLACE FUNCTION validate_memory_embedding_user()
RETURNS TRIGGER AS $$
DECLARE
    v_memory_user_id UUID;
BEGIN
    -- Get the user_id from the referenced memory
    SELECT user_id INTO v_memory_user_id
    FROM public.memories
    WHERE id = NEW.memory_id;

    -- Ensure it matches the embedding's user_id
    IF v_memory_user_id != NEW.user_id THEN
        RAISE EXCEPTION 'memory_embeddings.user_id must match memories.user_id';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_memory_embedding_user_trigger ON public.memory_embeddings;
CREATE TRIGGER validate_memory_embedding_user_trigger
BEFORE INSERT OR UPDATE ON public.memory_embeddings
FOR EACH ROW
EXECUTE FUNCTION validate_memory_embedding_user();

-- 1.6: Add audit view for identity verification
CREATE OR REPLACE VIEW identity_audit AS
SELECT
    'users' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_user_ids,
    CASE WHEN COUNT(*) = COUNT(DISTINCT id) THEN 'PASS' ELSE 'FAIL' END as uniqueness_check
FROM public.users
UNION ALL
SELECT
    'conversations',
    COUNT(*),
    COUNT(DISTINCT user_id),
    'N/A'
FROM public.conversations
UNION ALL
SELECT
    'messages',
    COUNT(*),
    COUNT(DISTINCT user_id),
    'N/A'
FROM public.messages
UNION ALL
SELECT
    'memories',
    COUNT(*),
    COUNT(DISTINCT user_id),
    'N/A'
FROM public.memories
UNION ALL
SELECT
    'mood_logs',
    COUNT(*),
    COUNT(DISTINCT user_id),
    'N/A'
FROM public.mood_logs;

-- Phase 1 Complete
-- Summary:
-- ✅ Removed duplicate email column from public.users
-- ✅ Added CHECK constraint for access_type
-- ✅ Implemented updated_at triggers on all tables
-- ✅ Added cross-table consistency validation
-- ✅ Created identity audit view
