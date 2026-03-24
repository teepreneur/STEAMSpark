-- CUMULATIVE FIX FOR PROFILE AND STUDENT TABLES
-- Run this in your Supabase SQL Editor to ensure all necessary columns exist

-- 1. Student Profile Expansion Fields (from previous phases)
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS favorite_subjects text[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS disliked_subjects text[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS spare_time_activities text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personal_devices text[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS study_habits text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_class_mode TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE students ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Admin Audit Timestamps
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
