-- Enable RLS on profiles table (Fixes security alert: "Table public.profiles is public, but RLS has not been enabled")
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Secure function to check teacher role
-- Uses SECURITY DEFINER to bypass RLS on profiles table to avoid infinite recursion
-- and reads from the database table rather than unsecured user_metadata
DROP FUNCTION IF EXISTS public.is_teacher();
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  );
END;
$$;

-- Add missing policy: Teachers need to view parent profiles for messaging and management
DROP POLICY IF EXISTS "Teachers can view parent profiles" ON public.profiles;
CREATE POLICY "Teachers can view parent profiles" ON public.profiles
    FOR SELECT USING (
        role = 'parent' 
        AND public.is_teacher()
    );
