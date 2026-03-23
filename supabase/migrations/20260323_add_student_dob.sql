-- Migration to add date_of_birth to students table and handle transition from age
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Comment for clarity
COMMENT ON COLUMN students.date_of_birth IS 'Student date of birth, used to calculate age dynamically';

-- We keep the age column for now to avoid breaking existing data/queries
-- but we will transition the app to prioritize date_of_birth.
