-- Fix inconsistent booking statuses for paid bookings
-- This script finds bookings that have a successful payment record but are not marked as confirmed/paid
-- and updates them to the correct status.

-- 1. Update bookings that have a successful payment but status is not confirmed
UPDATE public.bookings
SET 
    status = 'confirmed',
    payment_status = 'paid'
WHERE id IN (
    SELECT booking_id 
    FROM public.payments 
    WHERE status = 'success'
)
AND (status != 'confirmed' OR payment_status != 'paid' OR payment_status IS NULL);

-- 2. Ensure payment_status is 'paid' for all confirmed bookings (sanity check)
UPDATE public.bookings
SET payment_status = 'paid'
WHERE status = 'confirmed' 
AND (payment_status != 'paid' OR payment_status IS NULL);

-- 3. Ensure completed bookings are also marked as paid if missing
UPDATE public.bookings
SET payment_status = 'paid'
WHERE status = 'completed'
AND (payment_status != 'paid' OR payment_status IS NULL);

-- 4. Sync booking_sessions status with parent booking status
-- If booking is confirmed/paid, ensure sessions are confirmed
UPDATE public.booking_sessions
SET status = 'confirmed'
WHERE booking_id IN (
    SELECT id FROM public.bookings 
    WHERE status IN ('confirmed', 'completed')
    OR payment_status = 'paid'
)
AND status != 'confirmed' 
AND status != 'completed';
