-- Migration: Add tts_enabled column to user_settings
-- This fixes the missing column error

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS tts_enabled BOOLEAN DEFAULT FALSE;

-- Backfill existing rows
UPDATE public.user_settings 
SET tts_enabled = FALSE 
WHERE tts_enabled IS NULL;
