-- Fix RLS policies to allow teachers to view student and parent details for their bookings

-- 1. Allow teachers to view students enrolled in their gigs
-- This uses a join to bookings and gigs to ensure the teacher owns the gig associated with the student's booking
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.students;
CREATE POLICY "Teachers can view enrolled students" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            JOIN public.gigs ON bookings.gig_id = gigs.id
            WHERE bookings.student_id = students.id
            AND gigs.teacher_id = auth.uid()
        )
    );

-- 2. Allow teachers to view parent profiles for their bookings
-- This is more granular than the previous "view all parents" policy and ensures data privacy
DROP POLICY IF EXISTS "Teachers can view client profiles" ON public.profiles;
CREATE POLICY "Teachers can view client profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            JOIN public.gigs ON bookings.gig_id = gigs.id
            WHERE bookings.parent_id = profiles.id
            AND gigs.teacher_id = auth.uid()
        )
    );
