-- Safe implementation of teacher access to student/parent data
-- Uses a SECURITY DEFINER function to bypass RLS recursion

-- 1. Create a secure function to check if a teacher has a booking with a user
-- This runs with owner privileges, bypassing RLS on bookings/gigs tables
CREATE OR REPLACE FUNCTION public.teacher_has_booking_with(target_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user (teacher) has any gig that the target user booked (as parent)
  RETURN EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.gigs g ON b.gig_id = g.id
    WHERE b.parent_id = target_user_id
    AND g.teacher_id = auth.uid()
  );
END;
$$;

-- 2. Create function to check if a teacher has a student enrolled
CREATE OR REPLACE FUNCTION public.teacher_has_student_enrolled(target_student_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user (teacher) has any gig that the target student is enrolled in
  RETURN EXISTS (
    SELECT 1 
    FROM public.bookings b
    JOIN public.gigs g ON b.gig_id = g.id
    WHERE b.student_id = target_student_id
    AND g.teacher_id = auth.uid()
  );
END;
$$;


-- 3. Re-apply policies using the secure functions
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.students;
CREATE POLICY "Teachers can view enrolled students" ON public.students
    FOR SELECT USING (
        public.teacher_has_student_enrolled(id)
    );

DROP POLICY IF EXISTS "Teachers can view client profiles" ON public.profiles;
CREATE POLICY "Teachers can view client profiles" ON public.profiles
    FOR SELECT USING (
        public.teacher_has_booking_with(id)
    );
