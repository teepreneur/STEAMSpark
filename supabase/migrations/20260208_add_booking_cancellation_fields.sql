-- Add cancellation tracking columns to bookings table
-- Run this in Supabase SQL Editor

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('parent', 'teacher', 'admin'));

-- Add index for filtering cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;

COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason code for cancellation (too_expensive, found_alternative, schedule_conflict, etc.)';
COMMENT ON COLUMN bookings.cancellation_feedback IS 'Additional feedback text from the user who cancelled';
COMMENT ON COLUMN bookings.cancelled_by IS 'Who initiated the cancellation: parent, teacher, or admin';
