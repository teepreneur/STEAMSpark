-- Add persistent location fields to profiles table
-- These are for the default/base location of the user (Parent or Teacher)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT; -- 'home', 'school', 'learning_center', etc.

-- We don't need to add country, city, or class_mode as they already exist from add_location_fields.sql

COMMENT ON COLUMN profiles.latitude IS 'Persistent decimal latitude for the user''s base location';
COMMENT ON COLUMN profiles.longitude IS 'Persistent decimal longitude for the user''s base location';
COMMENT ON COLUMN profiles.address IS 'Full text address or landmark description';
COMMENT ON COLUMN profiles.location_type IS 'Category of the location (e.g., home, school, center)';
