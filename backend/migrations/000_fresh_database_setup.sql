-- ==========================================
-- WARMTH APP - FRESH DATABASE SETUP
-- Run this in a NEW Supabase project
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- 1. USERS TABLE (Profile Layer)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. CONVERSATIONS LAYER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- ==========================================
-- 3. MESSAGES LAYER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    emotions JSONB,
    topics TEXT[],
    sentiment_score FLOAT,
    intensity FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ==========================================
-- 4. MEMORIES LAYER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    importance FLOAT DEFAULT 0.5,
    expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

CREATE POLICY "Users can view their own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.memories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);

-- Memory Embeddings
CREATE TABLE IF NOT EXISTS public.memory_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    embedding vector(1536),
    model TEXT DEFAULT 'text-embedding-3-small',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memory embeddings" ON public.memory_embeddings;
DROP POLICY IF EXISTS "Users can insert their own memory embeddings" ON public.memory_embeddings;
DROP POLICY IF EXISTS "Users can update their own memory embeddings" ON public.memory_embeddings;
DROP POLICY IF EXISTS "Users can delete their own memory embeddings" ON public.memory_embeddings;

CREATE POLICY "Users can view their own memory embeddings" ON public.memory_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memory embeddings" ON public.memory_embeddings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memory embeddings" ON public.memory_embeddings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memory embeddings" ON public.memory_embeddings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory_id ON public.memory_embeddings(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user_id ON public.memory_embeddings(user_id);

-- Memory Access Log
CREATE TABLE IF NOT EXISTS public.memory_access_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL,
    relevance_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.memory_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memory access logs" ON public.memory_access_log;
DROP POLICY IF EXISTS "Users can insert their own memory access logs" ON public.memory_access_log;

CREATE POLICY "Users can view their own memory access logs" ON public.memory_access_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memory access logs" ON public.memory_access_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 5. EMOTIONAL INTELLIGENCE LAYER
-- ==========================================

-- Emotional Recaps
CREATE TABLE IF NOT EXISTS public.emotional_recaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    headline TEXT,
    narrative TEXT,
    top_emotions JSONB,
    key_topics TEXT[],
    recommendations JSONB,
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.emotional_recaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recaps" ON public.emotional_recaps;
DROP POLICY IF EXISTS "Users can insert their own recaps" ON public.emotional_recaps;
DROP POLICY IF EXISTS "Users can update their own recaps" ON public.emotional_recaps;
DROP POLICY IF EXISTS "Users can delete their own recaps" ON public.emotional_recaps;

CREATE POLICY "Users can view their own recaps" ON public.emotional_recaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recaps" ON public.emotional_recaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recaps" ON public.emotional_recaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recaps" ON public.emotional_recaps FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recaps_user_date ON public.emotional_recaps(user_id, created_at DESC);

-- Mood Logs
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score FLOAT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can insert their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can update their own mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Users can delete their own mood logs" ON public.mood_logs;

CREATE POLICY "Users can view their own mood logs" ON public.mood_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mood logs" ON public.mood_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood logs" ON public.mood_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood logs" ON public.mood_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON public.mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_created_at ON public.mood_logs(created_at DESC);

-- Mood Patterns
CREATE TABLE IF NOT EXISTS public.mood_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pattern_name TEXT NOT NULL,
    description TEXT,
    embedding vector(1536),
    associated_topics TEXT[],
    relevance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mood_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood patterns" ON public.mood_patterns;
DROP POLICY IF EXISTS "Users can insert their own mood patterns" ON public.mood_patterns;
DROP POLICY IF EXISTS "Users can update their own mood patterns" ON public.mood_patterns;
DROP POLICY IF EXISTS "Users can delete their own mood patterns" ON public.mood_patterns;

CREATE POLICY "Users can view their own mood patterns" ON public.mood_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mood patterns" ON public.mood_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mood patterns" ON public.mood_patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mood patterns" ON public.mood_patterns FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 6. JOURNALS & SETTINGS
-- ==========================================

-- Journals
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    mood_score FLOAT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own journals" ON public.journals;
DROP POLICY IF EXISTS "Users can insert their own journals" ON public.journals;
DROP POLICY IF EXISTS "Users can update their own journals" ON public.journals;
DROP POLICY IF EXISTS "Users can delete their own journals" ON public.journals;

CREATE POLICY "Users can view their own journals" ON public.journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journals" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journals" ON public.journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journals" ON public.journals FOR DELETE USING (auth.uid() = user_id);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    haptic_enabled BOOLEAN DEFAULT true,
    listening_mode BOOLEAN DEFAULT FALSE,
    tts_settings JSONB DEFAULT '{"voice": "alloy", "speed": 1.0}',
    memory_policy JSONB DEFAULT '{"auto_save": true, "retention_days": 365}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 7. RPC FUNCTIONS
-- ==========================================

-- Create Conversation
CREATE OR REPLACE FUNCTION create_conversation(p_title TEXT)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.conversations (user_id, title)
    VALUES (auth.uid(), p_title)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Message
CREATE OR REPLACE FUNCTION add_message(
    p_conversation_id UUID,
    p_role TEXT,
    p_content TEXT,
    p_emotions JSONB DEFAULT NULL,
    p_topics TEXT[] DEFAULT NULL,
    p_sentiment_score FLOAT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.messages (
        user_id, conversation_id, role, content, emotions, topics, sentiment_score
    )
    VALUES (
        auth.uid(), p_conversation_id, p_role, p_content, p_emotions, p_topics, p_sentiment_score
    )
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store Memory
CREATE OR REPLACE FUNCTION store_memory(p_content TEXT, p_importance FLOAT)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.memories (user_id, content, importance)
    VALUES (auth.uid(), p_content, p_importance)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fetch Relevant Memories (Similarity Search)
CREATE OR REPLACE FUNCTION fetch_relevant_memories(
    p_embedding vector(1536),
    p_match_threshold FLOAT,
    p_match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    importance FLOAT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.importance,
        1 - (me.embedding <=> p_embedding) AS similarity
    FROM
        public.memories m
    JOIN
        public.memory_embeddings me ON m.id = me.memory_id
    WHERE
        m.user_id = auth.uid()
        AND 1 - (me.embedding <=> p_embedding) > p_match_threshold
    ORDER BY
        similarity DESC
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log Memory Access
CREATE OR REPLACE FUNCTION log_memory_access(
    p_memory_id UUID,
    p_access_type TEXT,
    p_relevance_score FLOAT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.memory_access_log (user_id, memory_id, access_type, relevance_score)
    VALUES (auth.uid(), p_memory_id, p_access_type, p_relevance_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get User Homepage Payload
CREATE OR REPLACE FUNCTION get_user_homepage_payload()
RETURNS JSONB AS $$
DECLARE
    v_user_profile JSONB;
    v_preferences JSONB;
    v_recent_conversations JSONB;
    v_recent_moods JSONB;
    v_latest_recap JSONB;
BEGIN
    -- Get Profile
    SELECT to_jsonb(u.*) INTO v_user_profile FROM public.users u WHERE u.id = auth.uid();
    
    -- Get Preferences
    SELECT to_jsonb(s.*) INTO v_preferences FROM public.user_settings s WHERE s.user_id = auth.uid();
    
    -- Get Recent Conversations
    SELECT jsonb_agg(t.*) INTO v_recent_conversations FROM (
        SELECT id, title, updated_at FROM public.conversations 
        WHERE user_id = auth.uid() 
        ORDER BY updated_at DESC LIMIT 5
    ) t;
    
    -- Get Recent Moods
    SELECT jsonb_agg(t.*) INTO v_recent_moods FROM (
        SELECT score, note, created_at FROM public.mood_logs 
        WHERE user_id = auth.uid() AND created_at > now() - interval '7 days'
        ORDER BY created_at DESC
    ) t;
    
    -- Get Latest Recap
    SELECT to_jsonb(r.*) INTO v_latest_recap FROM (
        SELECT * FROM public.emotional_recaps 
        WHERE user_id = auth.uid() 
        ORDER BY created_at DESC LIMIT 1
    ) r;
    
    RETURN jsonb_build_object(
        'profile', v_user_profile,
        'preferences', v_preferences,
        'recent_conversations', COALESCE(v_recent_conversations, '[]'::jsonb),
        'recent_moods', COALESCE(v_recent_moods, '[]'::jsonb),
        'latest_recap', v_latest_recap
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
