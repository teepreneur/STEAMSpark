-- Run this migration in your Supabase SQL Editor
-- Adds missing columns to the bookings table for the booking form

-- Add session_date column (stores the preferred start date)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS session_date TIMESTAMPTZ;

-- Add preferred_days column (stores array of weekday names like ['Monday', 'Wednesday'])
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS preferred_days TEXT[];

-- Add preferred_time column (stores time like '15:00')
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- Add total_sessions column (number of sessions in the course)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 1;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('session_date', 'preferred_days', 'preferred_time', 'total_sessions');
