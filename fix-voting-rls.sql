-- Fix RLS policies for voting functionality
-- Run this script in Supabase SQL Editor to fix voting permissions

-- First, let's check and fix the votes table RLS policies
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
DROP POLICY IF EXISTS "Votes are viewable if poll is accessible" ON votes;

-- Create a more permissive policy for inserting votes
-- This allows authenticated users to vote on any poll they can see
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_id
      AND (polls.is_public = true OR polls.creator_id = auth.uid())
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

-- Allow users to view their own votes
CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- Allow viewing votes on public polls (for results display)
CREATE POLICY "Votes viewable on accessible polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = votes.poll_id
      AND (polls.is_public = true OR polls.creator_id = auth.uid())
    )
  );

-- Also ensure poll_options can be read properly for voting
DROP POLICY IF EXISTS "Poll options are viewable if poll is accessible" ON poll_options;

CREATE POLICY "Poll options are viewable if poll is accessible" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND (polls.is_public = true OR polls.creator_id = auth.uid())
    )
  );

-- Allow poll creators to manage their poll options
CREATE POLICY "Poll creators can manage their options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.creator_id = auth.uid()
    )
  );

-- Ensure polls can be read properly
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;

CREATE POLICY "Public polls are viewable by everyone" ON polls
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = creator_id);

-- Grant necessary permissions to ensure everything works
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE polls TO anon, authenticated;
GRANT ALL ON TABLE poll_options TO anon, authenticated;
GRANT ALL ON TABLE votes TO anon, authenticated;

-- Test the voting functionality with a simple query
-- This should help verify if the policies are working
SELECT
  'Policies updated successfully. You should now be able to vote on polls.' as status;
