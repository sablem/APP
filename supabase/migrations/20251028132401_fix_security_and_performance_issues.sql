/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues identified in the database audit.

  ## Changes

  ### 1. Add Missing Indexes on Foreign Keys
  - appointments_professional_id
  - challenge_completions_challenge_id
  - exercise_completions (exercise_id, user_id)
  - game_rooms (player1_id, player2_id, winner_id)
  - gratitude_wall_likes_user_id
  - gratitude_wall_posts_user_id
  - sports_event_participants_user_id
  - sports_events_creator_id
  - wellness_goals_user_id

  ### 2. Optimize RLS Policies
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

  ### 3. Remove Unused Indexes
  - idx_appointments_user_scheduled
  - idx_resources_category
  - idx_exercises_type
  - idx_gratitude_likes_post

  ### 4. Fix Function Search Path
  Add explicit search_path to functions to prevent security issues

  ## Security
  All changes maintain existing security while improving performance
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appointments_professional_id 
  ON appointments(professional_id);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id 
  ON challenge_completions(challenge_id);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_exercise_id 
  ON exercise_completions(exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_id 
  ON exercise_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_game_rooms_player1_id 
  ON game_rooms(player1_id);

CREATE INDEX IF NOT EXISTS idx_game_rooms_player2_id 
  ON game_rooms(player2_id);

CREATE INDEX IF NOT EXISTS idx_game_rooms_winner_id 
  ON game_rooms(winner_id);

CREATE INDEX IF NOT EXISTS idx_gratitude_wall_likes_user_id 
  ON gratitude_wall_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_gratitude_wall_posts_user_id 
  ON gratitude_wall_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_sports_event_participants_user_id 
  ON sports_event_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_sports_events_creator_id 
  ON sports_events(creator_id);

CREATE INDEX IF NOT EXISTS idx_wellness_goals_user_id 
  ON wellness_goals(user_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_appointments_user_scheduled;
DROP INDEX IF EXISTS idx_resources_category;
DROP INDEX IF EXISTS idx_exercises_type;
DROP INDEX IF EXISTS idx_gratitude_likes_post;

-- =====================================================
-- 3. RECREATE RLS POLICIES WITH OPTIMIZED auth.uid()
-- =====================================================

-- profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- mood_entries table
DROP POLICY IF EXISTS "Users can view own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can insert own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can delete own mood entries" ON mood_entries;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- journal_entries table
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- wellness_goals table
DROP POLICY IF EXISTS "Users can view own wellness goals" ON wellness_goals;
DROP POLICY IF EXISTS "Users can insert own wellness goals" ON wellness_goals;
DROP POLICY IF EXISTS "Users can update own wellness goals" ON wellness_goals;
DROP POLICY IF EXISTS "Users can delete own wellness goals" ON wellness_goals;

CREATE POLICY "Users can view own wellness goals"
  ON wellness_goals FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wellness goals"
  ON wellness_goals FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own wellness goals"
  ON wellness_goals FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own wellness goals"
  ON wellness_goals FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- appointments table
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- exercise_completions table
DROP POLICY IF EXISTS "Users can view own exercise completions" ON exercise_completions;
DROP POLICY IF EXISTS "Users can insert own exercise completions" ON exercise_completions;

CREATE POLICY "Users can view own exercise completions"
  ON exercise_completions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own exercise completions"
  ON exercise_completions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- game_rooms table
DROP POLICY IF EXISTS "Users can create game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Players can update their game rooms" ON game_rooms;

CREATE POLICY "Users can create game rooms"
  ON game_rooms FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = player1_id);

CREATE POLICY "Players can update their game rooms"
  ON game_rooms FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = player1_id OR (select auth.uid()) = player2_id)
  WITH CHECK ((select auth.uid()) = player1_id OR (select auth.uid()) = player2_id);

-- sports_events table
DROP POLICY IF EXISTS "Users can create sports events" ON sports_events;
DROP POLICY IF EXISTS "Event creators can update their events" ON sports_events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON sports_events;

CREATE POLICY "Users can create sports events"
  ON sports_events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Event creators can update their events"
  ON sports_events FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = creator_id)
  WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Event creators can delete their events"
  ON sports_events FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = creator_id);

-- sports_event_participants table
DROP POLICY IF EXISTS "Users can join events" ON sports_event_participants;
DROP POLICY IF EXISTS "Users can leave events they joined" ON sports_event_participants;

CREATE POLICY "Users can join events"
  ON sports_event_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can leave events they joined"
  ON sports_event_participants FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- challenge_completions table
DROP POLICY IF EXISTS "Users can view own challenge completions" ON challenge_completions;
DROP POLICY IF EXISTS "Users can complete challenges" ON challenge_completions;

CREATE POLICY "Users can view own challenge completions"
  ON challenge_completions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can complete challenges"
  ON challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- gratitude_wall_posts table
DROP POLICY IF EXISTS "Users can create posts" ON gratitude_wall_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON gratitude_wall_posts;

CREATE POLICY "Users can create posts"
  ON gratitude_wall_posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own posts"
  ON gratitude_wall_posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- gratitude_wall_likes table
DROP POLICY IF EXISTS "Users can like posts" ON gratitude_wall_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON gratitude_wall_likes;

CREATE POLICY "Users can like posts"
  ON gratitude_wall_likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike posts"
  ON gratitude_wall_likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- user_activity_stats table
DROP POLICY IF EXISTS "Users can insert own stats" ON user_activity_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_activity_stats;

CREATE POLICY "Users can insert own stats"
  ON user_activity_stats FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own stats"
  ON user_activity_stats FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATH
-- =====================================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO user_activity_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
