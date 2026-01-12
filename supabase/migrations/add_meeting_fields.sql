-- Add meeting link and class type to gigs

ALTER TABLE gigs ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'online'; -- 'online' | 'in_person' | 'hybrid'
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS meeting_platform TEXT; -- 'zoom' | 'google_meet' | null
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS meeting_link TEXT; -- Teacher's personal meeting link
