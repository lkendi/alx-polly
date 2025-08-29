# Supabase Setup Guide for Polly

This guide will help you set up Supabase authentication and database for your Polly polling application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js installed on your machine
- Git repository for your project

## Step 1: Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `polly-app` (or your preferred name)
   - **Database Password**: Generate a secure password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually takes 2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Project API Key** (anon public key)

## Step 3: Configure Environment Variables

1. In your project root, create a `.env.local` file:

```bash
# Copy from .env.example
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Authentication

### Enable Email/Password Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Authentication Settings**, ensure the following are enabled:
   - ✅ Enable email confirmations
   - ✅ Enable secure email change
3. Configure **Site URL**: `http://localhost:3000` (for development)
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - Add your production URL when ready (e.g., `https://yourapp.com/auth/callback`)

### Configure OAuth Providers (Optional)

#### Google OAuth:
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`

#### GitHub OAuth:
1. Go to **Authentication** → **Providers** → **GitHub**
2. Enable GitHub provider
3. Add your GitHub OAuth app credentials:
   - Client ID
   - Client Secret
4. Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`

## Step 5: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create the following tables by running these SQL commands:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  allow_multiple_votes BOOLEAN DEFAULT false,
  allow_add_options BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text VARCHAR(200) NOT NULL,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, poll_id, option_id)
);

-- Create user_profiles table for additional user data
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for polls
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
CREATE POLICY "Poll options are viewable by everyone if poll is public" ON poll_options
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
CREATE POLICY "Votes are viewable by everyone if poll is public" ON votes
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

-- Create RLS policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_is_public ON polls(is_public);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update poll votes count
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
    SET votes_count = votes_count - 1 
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update vote counts
CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE PROCEDURE public.update_poll_option_votes();
```

## Step 6: Test Your Setup

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000/auth/register`
3. Try creating a new account
4. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created
5. Check **Table Editor** → **user_profiles** to see if the profile was automatically created

## Step 7: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**: Welcome email with account verification
   - **Magic Link**: Passwordless login email
   - **Change Email Address**: Email change confirmation
   - **Reset Password**: Password reset instructions

Example custom template for signup confirmation:

```html
<h2>Welcome to Polly!</h2>
<p>Thanks for signing up! Click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
```

## Step 8: Set Up Production

When deploying to production:

1. Update your Supabase project settings:
   - **Site URL**: Your production domain
   - **Redirect URLs**: Add your production callback URL
2. Update your production environment variables
3. Consider setting up:
   - Email rate limiting
   - Custom SMTP for email sending
   - Database backups
   - Monitoring and logging

## Troubleshooting

### Common Issues:

**Authentication not working:**
- Check that your environment variables are correct
- Verify the callback URLs match your domain
- Check browser console for CORS errors

**Database permissions errors:**
- Ensure Row Level Security policies are set up correctly
- Check that the user ID matches the auth.uid() in policies

**Email confirmation not working:**
- Verify email templates are configured
- Check Supabase logs for email delivery issues
- Test with a different email provider if needed

### Useful Supabase Dashboard Sections:

- **Logs**: Check for errors and debug issues
- **API**: Test your database queries
- **Auth**: Monitor user signups and sessions
- **Storage**: If you plan to add file uploads later

## Next Steps

- Set up real-time subscriptions for live poll updates
- Add file upload capabilities for poll images
- Implement advanced analytics
- Set up email notifications for poll activities
- Add social features like comments and sharing

For more advanced configurations, check the [Supabase Documentation](https://supabase.com/docs).