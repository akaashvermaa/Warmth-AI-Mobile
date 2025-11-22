-- Fix 1: Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see ONLY their own chat messages
-- Fix: Cast auth.uid() to text because user_id column is text
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own chat messages
-- Fix: Cast auth.uid() to text because user_id column is text
CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Fix 2: Make memories_with_embeddings view respect RLS
ALTER VIEW public.memories_with_embeddings SET (security_invoker = true);
