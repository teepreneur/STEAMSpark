-- Revert the RLS policies that caused infinite recursion
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view client profiles" ON public.profiles;
