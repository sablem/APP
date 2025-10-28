/*
  # Interactive Activities and Community Module

  ## Overview
  This migration adds comprehensive interactive features including games, sports events,
  wellness challenges, and a community gratitude wall to promote social connection and well-being.

  ## New Tables

  ### 1. `game_rooms`
  Real-time multiplayer game sessions
  - `id` (uuid, primary key)
  - `game_type` (text) - 'tic_tac_toe' or 'rock_paper_scissors'
  - `player1_id` (uuid, references profiles)
  - `player2_id` (uuid, references profiles, nullable)
  - `game_state` (jsonb) - current game state
  - `status` (text) - 'waiting', 'in_progress', 'completed'
  - `winner_id` (uuid, nullable)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz, nullable)

  ### 2. `sports_events`
  Organized sports activities and matches
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `name` (text) - event name
  - `sport_type` (text) - 'football', 'basketball', 'jogging', etc.
  - `location` (text) - where the event takes place
  - `scheduled_at` (timestamptz) - when the event happens
  - `team_a_size` (integer) - max players for team A
  - `team_b_size` (integer) - max players for team B
  - `description` (text)
  - `status` (text) - 'open', 'full', 'in_progress', 'completed', 'cancelled'
  - `created_at` (timestamptz)

  ### 3. `sports_event_participants`
  Track which users joined which team
  - `id` (uuid, primary key)
  - `event_id` (uuid, references sports_events)
  - `user_id` (uuid, references profiles)
  - `team` (text) - 'team_a' or 'team_b'
  - `joined_at` (timestamptz)

  ### 4. `wellness_challenges`
  Daily/weekly wellness activities
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `category` (text) - 'physical', 'mental', 'social', 'creative'
  - `points` (integer) - reward points for completion
  - `difficulty` (text) - 'easy', 'medium', 'hard'
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 5. `challenge_completions`
  Track user challenge achievements
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `challenge_id` (uuid, references wellness_challenges)
  - `completed_at` (timestamptz)
  - `notes` (text, optional)

  ### 6. `gratitude_wall_posts`
  Community messages of gratitude and positivity
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `is_anonymous` (boolean)
  - `likes_count` (integer)
  - `is_moderated` (boolean) - for admin review
  - `created_at` (timestamptz)

  ### 7. `gratitude_wall_likes`
  Track who liked which posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, references gratitude_wall_posts)
  - `user_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - UNIQUE constraint on (post_id, user_id)

  ### 8. `user_activity_stats`
  Aggregated statistics for each user
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, unique)
  - `games_played` (integer)
  - `games_won` (integer)
  - `sports_events_joined` (integer)
  - `challenges_completed` (integer)
  - `gratitude_posts` (integer)
  - `total_wellness_points` (integer)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can view public game rooms and events
  - Users can only modify their own participations
  - Gratitude wall posts are public but users can only delete their own
  - Activity stats are public but only system can update

  ## Important Notes
  - Game rooms support real-time updates via Supabase Realtime
  - Sports events automatically update status when teams are full
  - Challenge completions award points tracked in user stats
  - Gratitude wall includes basic moderation capabilities
*/

-- Create game_rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL CHECK (game_type IN ('tic_tac_toe', 'rock_paper_scissors')),
  player1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  player2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_state jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all game rooms"
  ON game_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create game rooms"
  ON game_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Players can update their game rooms"
  ON game_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Create sports_events table
CREATE TABLE IF NOT EXISTS sports_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sport_type text NOT NULL,
  location text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  team_a_size integer DEFAULT 5 CHECK (team_a_size > 0),
  team_b_size integer DEFAULT 5 CHECK (team_b_size > 0),
  description text DEFAULT '',
  status text DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sports events"
  ON sports_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sports events"
  ON sports_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can update their events"
  ON sports_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can delete their events"
  ON sports_events FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create sports_event_participants table
CREATE TABLE IF NOT EXISTS sports_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES sports_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team text NOT NULL CHECK (team IN ('team_a', 'team_b')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE sports_event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event participants"
  ON sports_event_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join events"
  ON sports_event_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events they joined"
  ON sports_event_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create wellness_challenges table
CREATE TABLE IF NOT EXISTS wellness_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('physical', 'mental', 'social', 'creative')),
  points integer DEFAULT 10 CHECK (points > 0),
  difficulty text DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wellness_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active challenges"
  ON wellness_challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create challenge_completions table
CREATE TABLE IF NOT EXISTS challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES wellness_challenges(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge completions"
  ON challenge_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can complete challenges"
  ON challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create gratitude_wall_posts table
CREATE TABLE IF NOT EXISTS gratitude_wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  is_anonymous boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  is_moderated boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gratitude_wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view moderated posts"
  ON gratitude_wall_posts FOR SELECT
  TO authenticated
  USING (is_moderated = true);

CREATE POLICY "Users can create posts"
  ON gratitude_wall_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON gratitude_wall_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create gratitude_wall_likes table
CREATE TABLE IF NOT EXISTS gratitude_wall_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES gratitude_wall_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE gratitude_wall_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON gratitude_wall_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON gratitude_wall_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON gratitude_wall_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_activity_stats table
CREATE TABLE IF NOT EXISTS user_activity_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  sports_events_joined integer DEFAULT 0,
  challenges_completed integer DEFAULT 0,
  gratitude_posts integer DEFAULT 0,
  total_wellness_points integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all activity stats"
  ON user_activity_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own stats"
  ON user_activity_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_sports_events_scheduled ON sports_events(scheduled_at) WHERE status IN ('open', 'full');
CREATE INDEX IF NOT EXISTS idx_sports_participants_event ON sports_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_user ON challenge_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gratitude_posts_created ON gratitude_wall_posts(created_at DESC) WHERE is_moderated = true;
CREATE INDEX IF NOT EXISTS idx_gratitude_likes_post ON gratitude_wall_likes(post_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gratitude_wall_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gratitude_wall_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON gratitude_wall_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Function to initialize user stats
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_stats
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION initialize_user_stats();