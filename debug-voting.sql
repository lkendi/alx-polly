-- Debug script to check voting setup and RLS policies
-- Run this in Supabase SQL Editor to diagnose voting issues

-- Check if RLS is enabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('polls', 'poll_options', 'votes')
  AND schemaname = 'public';

-- Check existing RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('polls', 'poll_options', 'votes')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Check current user context
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Check if there are any polls available to vote on
SELECT
  id,
  title,
  creator_id,
  is_public,
  expires_at,
  created_at,
  CASE
    WHEN expires_at IS NULL THEN 'Never expires'
    WHEN expires_at > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM polls
ORDER BY created_at DESC
LIMIT 5;

-- Check poll options for the most recent poll
SELECT
  po.id,
  po.poll_id,
  po.text,
  po.votes_count,
  p.title as poll_title
FROM poll_options po
JOIN polls p ON po.poll_id = p.id
WHERE p.id = (
  SELECT id FROM polls
  WHERE is_public = true
  ORDER BY created_at DESC
  LIMIT 1
);

-- Check if the current user has any votes
SELECT
  v.id,
  v.poll_id,
  v.option_id,
  p.title as poll_title,
  po.text as option_text,
  v.created_at
FROM votes v
JOIN polls p ON v.poll_id = p.id
JOIN poll_options po ON v.option_id = po.id
WHERE v.user_id = auth.uid()
ORDER BY v.created_at DESC
LIMIT 10;

-- Test vote insertion permissions (this will show what the policy checks)
-- Replace 'your_poll_id' and 'your_option_id' with actual IDs
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO votes (user_id, poll_id, option_id)
SELECT
  auth.uid(),
  p.id,
  po.id
FROM polls p
JOIN poll_options po ON po.poll_id = p.id
WHERE p.is_public = true
  AND (p.expires_at IS NULL OR p.expires_at > NOW())
  AND NOT EXISTS (
    SELECT 1 FROM votes v
    WHERE v.user_id = auth.uid()
      AND v.poll_id = p.id
  )
LIMIT 1;

-- If the above INSERT fails, check what the policy is actually checking
SELECT
  p.id as poll_id,
  p.title,
  p.creator_id,
  p.is_public,
  p.expires_at,
  auth.uid() as current_user,
  CASE
    WHEN auth.uid() IS NULL THEN 'Not authenticated'
    WHEN p.is_public = true THEN 'Can vote (public poll)'
    WHEN p.creator_id = auth.uid() THEN 'Can vote (own poll)'
    ELSE 'Cannot vote'
  END as vote_permission,
  CASE
    WHEN p.expires_at IS NULL THEN 'Never expires'
    WHEN p.expires_at > NOW() THEN 'Active'
    ELSE 'Expired'
  END as poll_status
FROM polls p
WHERE p.is_public = true
ORDER BY p.created_at DESC
LIMIT 5;
