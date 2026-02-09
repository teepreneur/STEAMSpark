-- Enable RLS on booking_sessions if not already enabled
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Allow Teachers to view sessions for their gigs
-- This uses a join to bookings -> gigs to check teacher ownership
DROP POLICY IF EXISTS "Teachers can view their booking sessions" ON public.booking_sessions;
CREATE POLICY "Teachers can view their booking sessions" ON public.booking_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            JOIN public.gigs ON bookings.gig_id = gigs.id
            WHERE bookings.id = booking_sessions.booking_id
            AND gigs.teacher_id = auth.uid()
        )
    );

-- 2. Allow Parents to view their own sessions
DROP POLICY IF EXISTS "Parents can view their booking sessions" ON public.booking_sessions;
CREATE POLICY "Parents can view their booking sessions" ON public.booking_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_sessions.booking_id
            AND bookings.parent_id = auth.uid()
        )
    );
