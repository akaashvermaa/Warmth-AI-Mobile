-- ==========================================
-- FIX: Add missing service_role bypass policies
-- ==========================================
-- This migration adds service_role bypass policies for all tables
-- that were missing them, which was causing RLS violations.

-- Service role policy for messages (was incorrectly named chat_messages in code)
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.messages;
CREATE POLICY "Service role can manage all messages"
ON public.messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for conversations
DROP POLICY IF EXISTS "Service role can manage all conversations" ON public.conversations;
CREATE POLICY "Service role can manage all conversations"
ON public.conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for mood_logs
DROP POLICY IF EXISTS "Service role can manage all mood_logs" ON public.mood_logs;
CREATE POLICY "Service role can manage all mood_logs"
ON public.mood_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for journals
DROP POLICY IF EXISTS "Service role can manage all journals" ON public.journals;
CREATE POLICY "Service role can manage all journals"
ON public.journals
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for user_settings
DROP POLICY IF EXISTS "Service role can manage all user_settings" ON public.user_settings;
CREATE POLICY "Service role can manage all user_settings"
ON public.user_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for users
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for memory_access_log
DROP POLICY IF EXISTS "Service role can manage all memory_access_log" ON public.memory_access_log;
CREATE POLICY "Service role can manage all memory_access_log"
ON public.memory_access_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify all policies are in place
SELECT
    tablename,
    COUNT(*) FILTER (WHERE roles @> ARRAY['service_role']) as service_role_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
