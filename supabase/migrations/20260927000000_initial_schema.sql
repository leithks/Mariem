-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  tagline TEXT,
  currency TEXT DEFAULT 'EUR',
  custom_earnings_total NUMERIC
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  tutor_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  joined_date TEXT,
  monthly_fee NUMERIC,
  rate_per_hour NUMERIC,
  paid BOOLEAN DEFAULT false,
  last_paid_date TEXT,
  default_subject TEXT
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  tutor_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  student_ids TEXT[],
  color TEXT,
  topic TEXT,
  attendance JSONB DEFAULT '{}'::jsonb,
  paid_students JSONB DEFAULT '{}'::jsonb,
  series_id TEXT
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own students" ON students FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Users can insert their own students" ON students FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Users can update their own students" ON students FOR UPDATE USING (auth.uid() = tutor_id);
CREATE POLICY "Users can delete their own students" ON students FOR DELETE USING (auth.uid() = tutor_id);

CREATE POLICY "Users can view their own lessons" ON lessons FOR SELECT USING (auth.uid() = tutor_id);
CREATE POLICY "Users can insert their own lessons" ON lessons FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Users can update their own lessons" ON lessons FOR UPDATE USING (auth.uid() = tutor_id);
CREATE POLICY "Users can delete their own lessons" ON lessons FOR DELETE USING (auth.uid() = tutor_id);
