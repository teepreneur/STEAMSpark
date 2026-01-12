-- Add extended fields to students table for AI recommendations and teacher insights

ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_style TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_pace TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS strengths TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS challenges TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS special_needs TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_schedule TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_goals TEXT;

-- Add comments for documentation
COMMENT ON COLUMN students.learning_style IS 'visual, auditory, reading, kinesthetic';
COMMENT ON COLUMN students.learning_pace IS 'slow, moderate, fast';
COMMENT ON COLUMN students.strengths IS 'What the child is good at';
COMMENT ON COLUMN students.challenges IS 'Areas for improvement';
COMMENT ON COLUMN students.special_needs IS 'Accommodations or special considerations';
COMMENT ON COLUMN students.personality_notes IS 'Communication style and personality traits';
COMMENT ON COLUMN students.preferred_schedule IS 'Best times/days for learning';
COMMENT ON COLUMN students.parent_notes IS 'Additional notes from parent';
COMMENT ON COLUMN students.learning_goals IS 'Detailed learning objectives';
