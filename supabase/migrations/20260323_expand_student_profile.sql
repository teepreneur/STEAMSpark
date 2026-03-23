-- Migration to add more detailed information to student profiles
-- This expansion facilitates better personalization and teacher preparation

ALTER TABLE IF EXISTS students
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS school text,
ADD COLUMN IF NOT EXISTS favorite_subjects text[],
ADD COLUMN IF NOT EXISTS disliked_subjects text[],
ADD COLUMN IF NOT EXISTS spare_time_activities text,
ADD COLUMN IF NOT EXISTS personal_devices text[],
ADD COLUMN IF NOT EXISTS study_habits text;

-- Add comments for clarity
COMMENT ON COLUMN students.gender IS 'Gender of the student';
COMMENT ON COLUMN students.school IS 'Current school the student is attending';
COMMENT ON COLUMN students.favorite_subjects IS 'Top subjects the student enjoys';
COMMENT ON COLUMN students.disliked_subjects IS 'Top subjects the student dislikes';
COMMENT ON COLUMN students.spare_time_activities IS 'What the student does in their spare time';
COMMENT ON COLUMN students.personal_devices IS 'Devices the student has access to (laptop, tablet, etc.)';
COMMENT ON COLUMN students.study_habits IS 'How the student handles long study hours';
