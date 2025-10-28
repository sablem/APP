/*
  # Mental Health Student Support Platform - Initial Schema

  ## Overview
  This migration creates the foundational database structure for a student mental health platform,
  including user profiles, mood tracking, journaling, resources, appointments, and support features.

  ## New Tables

  ### 1. `profiles`
  Extended user profile information beyond auth.users
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `university` (text)
  - `field_of_study` (text)
  - `graduation_year` (integer)
  - `preferences` (jsonb) - stores notification settings, theme preferences, etc.
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `mood_entries`
  Daily mood tracking for students
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `mood_score` (integer, 1-10 scale)
  - `emotions` (text array) - tags like "anxious", "happy", "stressed"
  - `notes` (text) - optional brief note
  - `energy_level` (integer, 1-5)
  - `sleep_quality` (integer, 1-5)
  - `created_at` (timestamptz)

  ### 3. `journal_entries`
  Private, encrypted journal for emotional expression
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `content` (text) - encrypted on client side
  - `mood_at_writing` (integer)
  - `tags` (text array)
  - `is_favorite` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `wellness_goals`
  Personal well-being objectives
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `category` (text) - "sleep", "exercise", "social", "academic", "mindfulness"
  - `target_frequency` (text) - "daily", "weekly", "monthly"
  - `progress` (integer) - completion percentage
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 5. `professionals`
  Directory of mental health professionals and university services
  - `id` (uuid, primary key)
  - `name` (text)
  - `title` (text) - "Psychologist", "Counselor", "Therapist"
  - `specializations` (text array)
  - `university` (text)
  - `contact_email` (text)
  - `contact_phone` (text)
  - `availability` (jsonb)
  - `accepts_students` (boolean)
  - `languages` (text array)
  - `created_at` (timestamptz)

  ### 6. `appointments`
  Scheduling system for professional consultations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `professional_id` (uuid, references professionals)
  - `scheduled_at` (timestamptz)
  - `duration_minutes` (integer)
  - `status` (text) - "pending", "confirmed", "completed", "cancelled"
  - `notes` (text)
  - `is_first_session` (boolean)
  - `created_at` (timestamptz)

  ### 7. `resources`
  Articles, guides, and educational content
  - `id` (uuid, primary key)
  - `title` (text)
  - `content` (text)
  - `category` (text) - "anxiety", "stress", "depression", "sleep", "relationships"
  - `read_time_minutes` (integer)
  - `author` (text)
  - `tags` (text array)
  - `is_published` (boolean)
  - `view_count` (integer)
  - `created_at` (timestamptz)

  ### 8. `exercises`
  Guided breathing, meditation, and stress management exercises
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `type` (text) - "breathing", "meditation", "mindfulness", "grounding"
  - `duration_minutes` (integer)
  - `difficulty` (text) - "beginner", "intermediate", "advanced"
  - `instructions` (jsonb) - step-by-step guide
  - `audio_url` (text)
  - `created_at` (timestamptz)

  ### 9. `exercise_completions`
  Track which exercises users complete
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `exercise_id` (uuid, references exercises)
  - `rating` (integer, 1-5)
  - `feedback` (text)
  - `completed_at` (timestamptz)

  ### 10. `emergency_contacts`
  Crisis hotlines and emergency resources
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `phone_number` (text)
  - `country` (text)
  - `available_24_7` (boolean)
  - `supports_text` (boolean)
  - `languages` (text array)
  - `category` (text) - "suicide_prevention", "crisis", "mental_health", "substance_abuse"

  ## Security
  All tables enable Row Level Security (RLS) with policies ensuring:
  - Users can only access their own private data
  - Public resources and professionals are viewable by all authenticated users
  - Emergency contacts are accessible to everyone (including unauthenticated for crisis situations)

  ## Important Notes
  - Journal entries should be encrypted client-side before storage
  - Mood entries support granular tracking for better insights
  - Professional directory facilitates connections to help
  - Emergency contacts available without authentication for crisis access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  university text,
  field_of_study text,
  graduation_year integer,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  emotions text[] DEFAULT ARRAY[]::text[],
  notes text DEFAULT '',
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  mood_at_writing integer CHECK (mood_at_writing >= 1 AND mood_at_writing <= 10),
  tags text[] DEFAULT ARRAY[]::text[],
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create wellness_goals table
CREATE TABLE IF NOT EXISTS wellness_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  target_frequency text DEFAULT 'weekly',
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE wellness_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness goals"
  ON wellness_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness goals"
  ON wellness_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness goals"
  ON wellness_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness goals"
  ON wellness_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  specializations text[] DEFAULT ARRAY[]::text[],
  university text,
  contact_email text,
  contact_phone text,
  availability jsonb DEFAULT '{}'::jsonb,
  accepts_students boolean DEFAULT true,
  languages text[] DEFAULT ARRAY['English']::text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view professionals"
  ON professionals FOR SELECT
  TO authenticated
  USING (true);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES professionals(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  is_first_session boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  read_time_minutes integer DEFAULT 5,
  author text DEFAULT 'MindSpace Team',
  tags text[] DEFAULT ARRAY[]::text[],
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published resources"
  ON resources FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  duration_minutes integer NOT NULL,
  difficulty text DEFAULT 'beginner',
  instructions jsonb NOT NULL,
  audio_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Create exercise_completions table
CREATE TABLE IF NOT EXISTS exercise_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text DEFAULT '',
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise completions"
  ON exercise_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise completions"
  ON exercise_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  phone_number text NOT NULL,
  country text NOT NULL,
  available_24_7 boolean DEFAULT true,
  supports_text boolean DEFAULT false,
  languages text[] DEFAULT ARRAY['English']::text[],
  category text NOT NULL
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Emergency contacts accessible to everyone including unauthenticated users
CREATE POLICY "Anyone can view emergency contacts"
  ON emergency_contacts FOR SELECT
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created ON mood_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled ON appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);