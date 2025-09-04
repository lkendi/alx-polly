-- Simplified Polly Database Schema
-- This builds on your existing polls, poll_options, and votes tables
-- Run this in your Supabase SQL Editor

-- First, ensure RLS is enabled on all existing tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls
DROP POLICY IF EXISTS "Public polls are viewable by everyone" ON polls;
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;

CREATE POLICY "Public polls are viewable by everyone" ON polls
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = creator_id);

-- Create RLS policies for poll_options
DROP POLICY IF EXISTS "Poll options are viewable if poll is accessible" ON poll_options;
DROP POLICY IF EXISTS "Poll creators can manage options" ON poll_options;

CREATE POLICY "Poll options are viewable if poll is accessible" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND (polls.is_public = true OR polls.creator_id = auth.uid())
    )
  );

CREATE POLICY "Poll creators can manage options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.creator_id = auth.uid()
    )
  );

-- Create RLS policies for votes
DROP POLICY IF EXISTS "Votes are viewable if poll is accessible" ON votes;
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;

CREATE POLICY "Votes are viewable if poll is accessible" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = votes.poll_id
      AND (polls.is_public = true OR polls.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to automatically update vote counts
CREATE OR REPLACE FUNCTION public.update_poll_option_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options
    SET votes_count = GREATEST(0, votes_count - 1)
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update vote counts
DROP TRIGGER IF EXISTS on_vote_change ON votes;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE PROCEDURE public.update_poll_option_votes();

-- Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_creator_id ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_is_public ON polls(is_public);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE polls TO anon, authenticated;
GRANT ALL ON TABLE poll_options TO anon, authenticated;
GRANT ALL ON TABLE votes TO anon, authenticated;

-- Function to get user email for display (since we don't have user_profiles)
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  display_name TEXT;
BEGIN
  -- Get user email from auth.users (this requires service role or proper RLS)
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  -- Extract username from email (part before @)
  IF user_email IS NOT NULL THEN
    display_name := split_part(user_email, '@', 1);
  ELSE
    display_name := 'Unknown User';
  END IF;

  RETURN display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easier poll data retrieval with user info
CREATE OR REPLACE VIEW poll_details AS
SELECT
  p.*,
  public.get_user_display_name(p.creator_id) as creator_username
FROM polls p;

-- Grant access to the view and function
GRANT SELECT ON poll_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_display_name(UUID) TO anon, authenticated;

-- Function to clean up any inconsistent vote counts
CREATE OR REPLACE FUNCTION public.fix_vote_counts()
RETURNS void AS $$
BEGIN
  UPDATE poll_options
  SET votes_count = (
    SELECT COUNT(*)
    FROM votes
    WHERE votes.option_id = poll_options.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the vote count fix
SELECT public.fix_vote_counts();
