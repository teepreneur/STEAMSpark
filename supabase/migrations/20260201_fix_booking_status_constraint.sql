-- Fix bookings status check constraint to include 'pending_payment'
-- The constraint is blocking the update to 'pending_payment' status

-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Recreate with all valid status values including 'pending_payment'
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'completed', 'cancelled'));
