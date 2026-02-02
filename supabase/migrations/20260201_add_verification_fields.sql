-- Add verification and location fields to profiles table
-- Run this in your Supabase SQL Editor

-- 1. Add verification fields (CV, ID, Discovery Photo)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. Add location and teaching preference fields (if they don't exist yet)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_mode TEXT DEFAULT 'online';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Add comments for documentation
COMMENT ON COLUMN profiles.cv_url IS 'URL to the teacher''s curriculum vitae file';
COMMENT ON COLUMN profiles.id_url IS 'URL to the teacher''s government ID or passport scan';
COMMENT ON COLUMN profiles.photo_url IS 'URL to the teacher''s professional verification photo';
COMMENT ON COLUMN profiles.class_mode IS 'Preferred class mode: online, in_person, or hybrid';
COMMENT ON COLUMN profiles.country IS 'Teacher''s country for matching';
COMMENT ON COLUMN profiles.city IS 'Teacher''s city or town for matching';
