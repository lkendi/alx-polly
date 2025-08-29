-- =====================================================
-- Polly Polling App - Database Schema
-- =====================================================
-- This migration creates the complete database schema for the polling app
-- including tables, indexes, RLS policies, triggers, and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200) GENERATED ALWAYS AS (
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL
      THEN first_name
      WHEN last_name IS NOT NULL
      THEN last_name
      ELSE username
    END
  ) STORED,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL CHECK (length(trim(title)) >= 3),
  description TEXT DEFAULT '',
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  allow_multiple_votes BOOLEAN DEFAULT false,
  allow_add_options BOOLEAN DEFAULT false,
  allow_anonymous_votes BOOLEAN DEFAULT false,
  require_captcha BOOLEAN DEFAULT false,
  max_votes_per_user INTEGER DEFAULT NULL CHECK (max_votes_per_user IS NULL OR max_votes_per_user > 0),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'draft')),
  featured BOOLEAN DEFAULT false,
  total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
  total_unique_voters INTEGER DEFAULT 0 CHECK (total_unique_voters >= 0),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options table
CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  text VARCHAR(200) NOT NULL CHECK (length(trim(text)) >= 1),
  description TEXT DEFAULT '',
  votes_count INTEGER DEFAULT 0 CHECK (votes_count >= 0),
  image_url TEXT,
  color VARCHAR(7), -- hex color code
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique votes per user per option (unless multiple votes allowed)
  UNIQUE(user_id, poll_id, option_id),

  -- Ensure at least user_id or ip_address is present for anonymous votes
  CHECK (
    (user_id IS NOT NULL) OR
    (is_anonymous = true AND ip_address IS NOT NULL)
  )
);

-- Poll categories table
CREATE TABLE poll_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll-category junction table
CREATE TABLE poll_category_assignments (
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  category_id UUID REFERENCES poll_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (poll_id, category_id)
);

-- Poll comments table
CREATE TABLE poll_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES poll_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) >= 1),
  is_edited BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll reactions table (likes, shares, bookmarks)
CREATE TABLE poll_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'bookmark', 'share', 'report')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, reaction_type)
);

-- Poll analytics/views table
CREATE TABLE poll_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User following table
CREATE TABLE user_follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('poll_comment', 'poll_like', 'poll_vote', 'user_follow', 'poll_mention')),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Polls indexes
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_updated_at ON polls(updated_at DESC);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_is_public ON polls(is_public);
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
CREATE INDEX idx_polls_featured ON polls(featured);
CREATE INDEX idx_polls_total_votes ON polls(total_votes DESC);
CREATE INDEX idx_polls_tags ON polls USING GIN(tags);

-- Poll options indexes
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_options_order ON poll_options(poll_id, order_index);
CREATE INDEX idx_poll_options_votes_count ON poll_options(votes_count DESC);

-- Votes indexes
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX idx_votes_ip_address ON votes(ip_address);

-- Comments indexes
CREATE INDEX idx_poll_comments_poll_id ON poll_comments(poll_id);
CREATE INDEX idx_poll_comments_user_id ON poll_comments(user_id);
CREATE INDEX idx_poll_comments_parent_id ON poll_comments(parent_id);
CREATE INDEX idx_poll_comments_created_at ON poll_comments(created_at DESC);

-- Reactions indexes
CREATE INDEX idx_poll_reactions_poll_id ON poll_reactions(poll_id);
CREATE INDEX idx_poll_reactions_user_id ON poll_reactions(user_id);
CREATE INDEX idx_poll_reactions_type ON poll_reactions(reaction_type);

-- Views indexes
CREATE INDEX idx_poll_views_poll_id ON poll_views(poll_id);
CREATE INDEX idx_poll_views_created_at ON poll_views(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls policies
CREATE POLICY "Public polls are viewable by everyone" ON polls
  FOR SELECT USING (
    is_public = true AND status != 'draft'
    OR auth.uid() = creator_id
    OR auth.uid() IS NOT NULL -- authenticated users can see all non-draft polls
  );

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
CREATE POLICY "Poll options are viewable with their polls" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND (
        (polls.is_public = true AND polls.status != 'draft')
        OR polls.creator_id = auth.uid()
        OR auth.uid() IS NOT NULL
      )
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

CREATE POLICY "Users can add options if allowed" ON poll_options
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.allow_add_options = true
      AND polls.status = 'active'
    )
  );

-- Votes policies
CREATE POLICY "Votes are viewable with their polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = votes.poll_id
      AND (
        (polls.is_public = true AND polls.status != 'draft')
        OR polls.creator_id = auth.uid()
        OR votes.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL))
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_id
      AND polls.status = 'active'
      AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
    )
  );

CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Poll categories policies
CREATE POLICY "Categories are viewable by everyone" ON poll_categories
  FOR SELECT USING (is_active = true);

-- Poll comments policies
CREATE POLICY "Comments are viewable with their polls" ON poll_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_comments.poll_id
      AND (
        (polls.is_public = true AND polls.status != 'draft')
        OR polls.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments" ON poll_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_id
      AND polls.status = 'active'
    )
  );

CREATE POLICY "Users can update their own comments" ON poll_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON poll_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Poll reactions policies
CREATE POLICY "Reactions are viewable with their polls" ON poll_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_reactions.poll_id
      AND (
        (polls.is_public = true AND polls.status != 'draft')
        OR polls.creator_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own reactions" ON poll_reactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Poll views policies
CREATE POLICY "Poll creators can view their poll analytics" ON poll_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_views.poll_id
      AND polls.creator_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert poll views" ON poll_views
  FOR INSERT WITH CHECK (true);

-- User follows policies
CREATE POLICY "Follows are viewable by involved users" ON user_follows
  FOR SELECT USING (
    auth.uid() = follower_id
    OR auth.uid() = following_id
  );

CREATE POLICY "Users can manage their own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_options_updated_at
    BEFORE UPDATE ON poll_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_comments_updated_at
    BEFORE UPDATE ON poll_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from email or use metadata
  username_base := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Ensure username is unique
  final_username := username_base;
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := username_base || counter::text;
  END LOOP;

  INSERT INTO public.user_profiles (
    id,
    username,
    first_name,
    last_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update option votes count
    UPDATE poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id;

    -- Update poll total votes
    UPDATE polls
    SET total_votes = total_votes + 1,
        total_unique_voters = (
          SELECT COUNT(DISTINCT user_id)
          FROM votes
          WHERE poll_id = NEW.poll_id
          AND user_id IS NOT NULL
        ) + (
          SELECT COUNT(DISTINCT ip_address)
          FROM votes
          WHERE poll_id = NEW.poll_id
          AND user_id IS NULL
          AND ip_address IS NOT NULL
        )
    WHERE id = NEW.poll_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Update option votes count
    UPDATE poll_options
    SET votes_count = GREATEST(votes_count - 1, 0)
    WHERE id = OLD.option_id;

    -- Update poll total votes
    UPDATE polls
    SET total_votes = GREATEST(total_votes - 1, 0),
        total_unique_voters = (
          SELECT COUNT(DISTINCT user_id)
          FROM votes
          WHERE poll_id = OLD.poll_id
          AND user_id IS NOT NULL
        ) + (
          SELECT COUNT(DISTINCT ip_address)
          FROM votes
          WHERE poll_id = OLD.poll_id
          AND user_id IS NULL
          AND ip_address IS NOT NULL
        )
    WHERE id = OLD.poll_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update vote counts
CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_votes_count();

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for future reaction count updates
  -- You can extend this to update likes_count, shares_count etc. on polls
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  message_param TEXT DEFAULT NULL,
  data_param JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (user_id_param, type_param, title_param, message_param, data_param)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for poll statistics
CREATE VIEW poll_stats AS
SELECT
  p.id,
  p.title,
  p.creator_id,
  p.created_at,
  p.total_votes,
  p.total_unique_voters,
  COUNT(DISTINCT pc.id) as comments_count,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.reaction_type = 'like') as likes_count,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.reaction_type = 'bookmark') as bookmarks_count,
  COUNT(DISTINCT pv.id) as views_count
FROM polls p
LEFT JOIN poll_comments pc ON p.id = pc.poll_id
LEFT JOIN poll_reactions pr ON p.id = pr.poll_id
LEFT JOIN poll_views pv ON p.id = pv.poll_id
GROUP BY p.id, p.title, p.creator_id, p.created_at, p.total_votes, p.total_unique_voters;

-- View for user statistics
CREATE VIEW user_stats AS
SELECT
  u.id,
  up.username,
  up.full_name,
  COUNT(DISTINCT p.id) as polls_created,
  COUNT(DISTINCT v.id) as votes_cast,
  COUNT(DISTINCT pc.id) as comments_made,
  COUNT(DISTINCT followers.follower_id) as followers_count,
  COUNT(DISTINCT following.following_id) as following_count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN polls p ON u.id = p.creator_id
LEFT JOIN votes v ON u.id = v.user_id
LEFT JOIN poll_comments pc ON u.id = pc.user_id
LEFT JOIN user_follows followers ON u.id = followers.following_id
LEFT JOIN user_follows following ON u.id = following.follower_id
GROUP BY u.id, up.username, up.full_name;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default poll categories
INSERT INTO poll_categories (name, description, slug, color, icon) VALUES
('General', 'General purpose polls', 'general', '#6366f1', 'MessageSquare'),
('Technology', 'Technology and programming related polls', 'technology', '#3b82f6', 'Monitor'),
('Entertainment', 'Movies, music, games and entertainment', 'entertainment', '#f59e0b', 'Film'),
('Sports', 'Sports and fitness related polls', 'sports', '#ef4444', 'Trophy'),
('Food', 'Food and cooking polls', 'food', '#10b981', 'UtensilsCrossed'),
('Travel', 'Travel and places', 'travel', '#8b5cf6', 'MapPin'),
('Education', 'Learning and education', 'education', '#f97316', 'GraduationCap'),
('Business', 'Business and career', 'business', '#6b7280', 'Briefcase');

-- =====================================================
-- SECURITY DEFINER FUNCTIONS FOR API
-- =====================================================

-- Function to get poll with options and user vote status
CREATE OR REPLACE FUNCTION get_poll_with_details(poll_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_user_id UUID := auth.uid();
BEGIN
  SELECT json_build_object(
    'poll', json_build_object(
      'id', p.id,
      'title', p.title,
      'description', p.description,
      'creator_id', p.creator_id,
      'creator', json_build_object(
        'id', up.id,
        'username', up.username,
        'full_name', up.full_name,
        'avatar_url', up.avatar_url
      ),
      'is_public', p.is_public,
      'allow_multiple_votes', p.allow_multiple_votes,
      'allow_add_options', p.allow_add_options,
      'expires_at', p.expires_at,
      'status', p.status,
      'total_votes', p.total_votes,
      'total_unique_voters', p.total_unique_voters,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ),
    'options', COALESCE(options_json, '[]'::json),
    'user_votes', COALESCE(user_votes_json, '[]'::json),
    'has_voted', COALESCE(has_voted, false)
  ) INTO result
  FROM polls p
  LEFT JOIN user_profiles up ON p.creator_id = up.id
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
      'id', po.id,
      'text', po.text,
      'description', po.description,
      'votes_count', po.votes_count,
      'image_url', po.image_url,
      'color', po.color,
      'order_index', po.order_index
    ) ORDER BY po.order_index) as options_json
    FROM poll_options po
    WHERE po.poll_id = p.id
  ) options ON true
  LEFT JOIN LATERAL (
    SELECT
      json_agg(v.option_id) as user_votes_json,
      COUNT(*) > 0 as has_voted
    FROM votes v
    WHERE v.poll_id = p.id AND v.user_id = current_user_id
  ) user_votes ON true
  WHERE p.id = poll_id_param;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_poll_with_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
