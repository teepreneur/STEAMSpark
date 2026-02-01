-- Add meeting_link column to bookings table
-- This stores the meeting link for individual bookings (set when teacher accepts)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Also add it to booking_sessions if not exists
ALTER TABLE booking_sessions ADD COLUMN IF NOT EXISTS meeting_link TEXT;
