-- Migration: Add emotion analysis to messages and create recaps table
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on messages if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view own messages') THEN
        CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert own messages') THEN
        CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 1. Add emotion analysis columns to messages table
ALTER TABLE IF EXISTS messages 
ADD COLUMN IF NOT EXISTS emotions JSONB,
ADD COLUMN IF NOT EXISTS topics TEXT[],
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS intensity FLOAT;

-- 2. Create emotional_recaps table
CREATE TABLE IF NOT EXISTS emotional_recaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  headline TEXT,
  narrative TEXT,
  top_emotions JSONB,
  key_topics TEXT[],
  recommendations JSONB,
  viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_user_emotions 
ON messages(user_id, created_at DESC) 
WHERE emotions IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recaps_user_date 
ON emotional_recaps(user_id, created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE emotional_recaps ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for emotional_recaps
CREATE POLICY "Users can view own recaps" 
ON emotional_recaps FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recaps" 
ON emotional_recaps FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recaps" 
ON emotional_recaps FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recaps" 
ON emotional_recaps FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for emotional_recaps
DROP TRIGGER IF EXISTS update_emotional_recaps_updated_at ON emotional_recaps;
CREATE TRIGGER update_emotional_recaps_updated_at 
BEFORE UPDATE ON emotional_recaps 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to check if user needs a new recap
CREATE OR REPLACE FUNCTION needs_new_recap(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_recap_date TIMESTAMP;
  message_count INTEGER;
BEGIN
  -- Get the date of the last recap
  SELECT created_at INTO last_recap_date
  FROM emotional_recaps
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no recap exists, check if user has at least 5 messages
  IF last_recap_date IS NULL THEN
    SELECT COUNT(*) INTO message_count
    FROM messages
    WHERE user_id = p_user_id;
    
    RETURN message_count >= 5;
  END IF;
  
  -- Check if it's been 3+ days since last recap
  IF NOW() - last_recap_date >= INTERVAL '3 days' THEN
    -- Check if there are new messages since last recap
    SELECT COUNT(*) INTO message_count
    FROM messages
    WHERE user_id = p_user_id 
    AND created_at > last_recap_date;
    
    RETURN message_count >= 3;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON emotional_recaps TO authenticated;
-- Removed GRANT USAGE on sequence as ID is UUID, not SERIAL

-- Verification queries
-- SELECT * FROM emotional_recaps LIMIT 5;
-- SELECT user_id, emotions, topics, sentiment_score FROM messages WHERE emotions IS NOT NULL LIMIT 10;
-- SELECT needs_new_recap('your-user-id-here');
