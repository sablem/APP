import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  university: string | null;
  field_of_study: string | null;
  graduation_year: number | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type MoodEntry = {
  id: string;
  user_id: string;
  mood_score: number;
  emotions: string[];
  notes: string;
  energy_level: number | null;
  sleep_quality: number | null;
  created_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood_at_writing: number | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type WellnessGoal = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_frequency: string;
  progress: number;
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
};

export type Professional = {
  id: string;
  name: string;
  title: string;
  specializations: string[];
  university: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  availability: Record<string, any>;
  accepts_students: boolean;
  languages: string[];
  created_at: string;
};

export type Exercise = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number;
  difficulty: string;
  instructions: Record<string, any>;
  audio_url: string | null;
  created_at: string;
};

export type EmergencyContact = {
  id: string;
  name: string;
  description: string;
  phone_number: string;
  country: string;
  available_24_7: boolean;
  supports_text: boolean;
  languages: string[];
  category: string;
};
