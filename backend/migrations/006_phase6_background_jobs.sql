-- ==========================================
-- PHASE 6: Background Jobs & Embeddings
-- ==========================================

-- 6.1: Create Embedding Queue Table
-- This table manages the asynchronous processing of embeddings
CREATE TABLE IF NOT EXISTS public.embedding_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one active queue item per memory to prevent duplicate processing
    CONSTRAINT unique_active_memory UNIQUE (memory_id)
);

-- Enable RLS (Service Role only)
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;

-- Only service role should access this queue
CREATE POLICY "Service role can manage embedding queue"
ON public.embedding_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6.2: Add updated_at trigger to queue
DROP TRIGGER IF EXISTS update_embedding_queue_updated_at ON public.embedding_queue;
CREATE TRIGGER update_embedding_queue_updated_at
BEFORE UPDATE ON public.embedding_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6.3: Idempotent Queue Function
-- Automatically adds memory to queue if not already present
CREATE OR REPLACE FUNCTION queue_memory_embedding(p_memory_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.embedding_queue (memory_id, status)
    VALUES (p_memory_id, 'pending')
    ON CONFLICT (memory_id) DO UPDATE
    SET status = 'pending',
        attempts = 0,
        error_message = NULL,
        updated_at = now()
    WHERE public.embedding_queue.status = 'failed'; -- Only retry if failed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4: Trigger to auto-queue new memories
CREATE OR REPLACE FUNCTION trigger_queue_memory_embedding()
RETURNS TRIGGER AS $$
BEGIN
    -- Only queue if embedding_state is pending (default)
    IF NEW.embedding_state = 'pending' THEN
        PERFORM queue_memory_embedding(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_queue_memory_embedding ON public.memories;
CREATE TRIGGER auto_queue_memory_embedding
AFTER INSERT ON public.memories
FOR EACH ROW
EXECUTE FUNCTION trigger_queue_memory_embedding();

-- 6.5: Claim Work Function (Atomic)
-- Used by background worker to fetch batch of pending items
CREATE OR REPLACE FUNCTION claim_embedding_work(p_batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
    queue_id UUID,
    memory_id UUID,
    content TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH claimed AS (
        UPDATE public.embedding_queue
        SET status = 'processing',
            attempts = attempts + 1,
            updated_at = now()
        WHERE id IN (
            SELECT id
            FROM public.embedding_queue
            WHERE status = 'pending'
            AND attempts < 3 -- Max retries
            ORDER BY created_at ASC
            LIMIT p_batch_size
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, embedding_queue.memory_id
    )
    SELECT 
        c.id AS queue_id,
        m.id AS memory_id,
        m.content,
        m.user_id
    FROM claimed c
    JOIN public.memories m ON c.memory_id = m.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6: Complete Work Function
-- Updates queue and memory state after processing
CREATE OR REPLACE FUNCTION complete_embedding_work(
    p_queue_id UUID,
    p_embedding vector(1536),
    p_model TEXT DEFAULT 'text-embedding-3-small',
    p_dim INTEGER DEFAULT 1536
)
RETURNS VOID AS $$
DECLARE
    v_memory_id UUID;
    v_user_id UUID;
BEGIN
    -- Get memory_id from queue
    SELECT memory_id INTO v_memory_id
    FROM public.embedding_queue
    WHERE id = p_queue_id;

    IF v_memory_id IS NULL THEN
        RAISE EXCEPTION 'Queue item not found';
    END IF;

    -- Get user_id from memory
    SELECT user_id INTO v_user_id
    FROM public.memories
    WHERE id = v_memory_id;

    -- Insert embedding
    INSERT INTO public.memory_embeddings (
        memory_id, user_id, embedding, model, embedding_dim
    )
    VALUES (
        v_memory_id, v_user_id, p_embedding, p_model, p_dim
    );

    -- Update memory state
    UPDATE public.memories
    SET embedding_state = 'embedded'
    WHERE id = v_memory_id;

    -- Mark queue as completed
    UPDATE public.embedding_queue
    SET status = 'completed',
        processed_at = now()
    WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7: Fail Work Function
-- Handles processing failures
CREATE OR REPLACE FUNCTION fail_embedding_work(
    p_queue_id UUID,
    p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.embedding_queue
    SET status = 'failed',
        error_message = p_error_message
    WHERE id = p_queue_id;

    -- Also update memory state
    UPDATE public.memories
    SET embedding_state = 'failed'
    WHERE id = (SELECT memory_id FROM public.embedding_queue WHERE id = p_queue_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 6 Complete
-- Summary:
-- ✅ Created embedding_queue table with RLS
-- ✅ Implemented idempotent queueing logic
-- ✅ Added auto-queue trigger for new memories
-- ✅ Created atomic claim_embedding_work function for workers
-- ✅ Created complete/fail work functions
