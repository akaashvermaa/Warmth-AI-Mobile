-- ==========================================
-- PHASE 3: Schema Optimization
-- ==========================================

-- 3.1: Add embedding metadata columns
ALTER TABLE public.memory_embeddings
ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS embedding_dim INTEGER DEFAULT 1536,
ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER;

-- 3.2: Add embedding state to memories for tracking
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS embedding_state TEXT DEFAULT 'pending'
CHECK (embedding_state IN ('pending', 'processing', 'embedded', 'failed'));

-- 3.3: Create composite indexes for common query patterns
-- User + created_at for timeline queries
CREATE INDEX IF NOT EXISTS idx_messages_user_created 
ON public.messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_created 
ON public.mood_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_user_created 
ON public.memories(user_id, created_at DESC);

-- User + updated_at for "recently modified" queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON public.conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_journals_user_updated 
ON public.journals(user_id, updated_at DESC);

-- Conversation + created_at for message history
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at ASC);

-- 3.4: Create HNSW vector index for fast similarity search
-- This significantly improves vector search performance
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector_hnsw
ON public.memory_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3.5: Add index on embedding_state for queue processing
CREATE INDEX IF NOT EXISTS idx_memories_embedding_state
ON public.memories(embedding_state)
WHERE embedding_state IN ('pending', 'processing');

-- 3.6: Create performance monitoring view
CREATE OR REPLACE VIEW performance_metrics AS
SELECT
    'messages' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users,
    pg_size_pretty(pg_total_relation_size('public.messages')) as total_size,
    pg_size_pretty(pg_indexes_size('public.messages')) as index_size
FROM public.messages
UNION ALL
SELECT
    'memories',
    COUNT(*),
    COUNT(DISTINCT user_id),
    pg_size_pretty(pg_total_relation_size('public.memories')),
    pg_size_pretty(pg_indexes_size('public.memories'))
FROM public.memories
UNION ALL
SELECT
    'memory_embeddings',
    COUNT(*),
    COUNT(DISTINCT user_id),
    pg_size_pretty(pg_total_relation_size('public.memory_embeddings')),
    pg_size_pretty(pg_indexes_size('public.memory_embeddings'))
FROM public.memory_embeddings
UNION ALL
SELECT
    'conversations',
    COUNT(*),
    COUNT(DISTINCT user_id),
    pg_size_pretty(pg_total_relation_size('public.conversations')),
    pg_size_pretty(pg_indexes_size('public.conversations'))
FROM public.conversations
UNION ALL
SELECT
    'mood_logs',
    COUNT(*),
    COUNT(DISTINCT user_id),
    pg_size_pretty(pg_total_relation_size('public.mood_logs')),
    pg_size_pretty(pg_indexes_size('public.mood_logs'))
FROM public.mood_logs;

-- 3.7: Create function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(p_query TEXT)
RETURNS TABLE (
    query_plan TEXT,
    execution_time_ms FLOAT
) AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_plan TEXT;
BEGIN
    -- Get query plan
    EXECUTE 'EXPLAIN (FORMAT TEXT) ' || p_query INTO v_plan;
    
    -- Measure execution time
    v_start_time := clock_timestamp();
    EXECUTE p_query;
    v_end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        v_plan,
        EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
END;
$$ LANGUAGE plpgsql;

-- 3.8: Add table statistics refresh function
CREATE OR REPLACE FUNCTION refresh_table_statistics()
RETURNS VOID AS $$
BEGIN
    -- Analyze all user tables to update query planner statistics
    ANALYZE public.users;
    ANALYZE public.conversations;
    ANALYZE public.messages;
    ANALYZE public.memories;
    ANALYZE public.memory_embeddings;
    ANALYZE public.mood_logs;
    ANALYZE public.journals;
    ANALYZE public.user_settings;
    ANALYZE public.emotional_recaps;
    ANALYZE public.mood_patterns;
    ANALYZE public.memory_access_log;
END;
$$ LANGUAGE plpgsql;

-- Run initial statistics refresh
SELECT refresh_table_statistics();

-- Phase 3 Complete
-- Summary:
-- ✅ Added embedding metadata (model_version, embedding_dim, generation_time_ms)
-- ✅ Added embedding_state to memories for tracking
-- ✅ Created 7 composite indexes for common query patterns
-- ✅ Created HNSW vector index for fast similarity search
-- ✅ Created performance monitoring view
-- ✅ Added query performance analysis function
-- ✅ Refreshed table statistics for query planner
