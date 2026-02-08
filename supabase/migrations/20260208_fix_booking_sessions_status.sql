-- Add 'confirmed' status to booking_sessions table
-- This allows the payment verification to update sessions to 'confirmed' status

-- First, drop the existing constraint
ALTER TABLE booking_sessions DROP CONSTRAINT IF EXISTS booking_sessions_status_check;

-- Add the new constraint with 'confirmed' included
ALTER TABLE booking_sessions 
ADD CONSTRAINT booking_sessions_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'));

-- Also add an INSERT policy for parents (they need to create sessions when booking)
DROP POLICY IF EXISTS "Parents can create booking sessions" ON booking_sessions;
CREATE POLICY "Parents can create booking sessions"
    ON booking_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_sessions.booking_id
            AND b.parent_id = auth.uid()
        )
    );

-- Add UPDATE policy for the system (service role) to update session status
-- This is needed for the payment verification API
DROP POLICY IF EXISTS "Service role can update sessions" ON booking_sessions;
CREATE POLICY "Service role can update sessions"
    ON booking_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);
