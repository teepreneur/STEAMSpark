-- Add location and class mode fields to students table
-- This allows parents to specify preferred learning environment per child
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS preferred_class_mode TEXT, -- 'online', 'in_person'
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN students.preferred_class_mode IS 'Preferred learning environment for the child';
COMMENT ON COLUMN students.latitude IS 'Latitude of the child''s primary class location (usually home)';
COMMENT ON COLUMN students.longitude IS 'Longitude of the child''s primary class location (usually home)';
COMMENT ON COLUMN students.address IS 'Full address or descriptive location for in-person classes';
