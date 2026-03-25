-- Allow all users to view teacher profiles for the marketplace
DROP POLICY IF EXISTS "Anyone can view teacher profiles" ON public.profiles;
CREATE POLICY "Anyone can view teacher profiles" ON public.profiles
    FOR SELECT USING (role = 'teacher');

-- Ensure parents can see verified status and basic info
-- This is already covered by the policy above if role is 'teacher'
