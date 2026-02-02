-- NUCLEAR OPTION: Complete RLS Reset for Profiles Table
-- Run this if you're getting 500 errors on profile queries

-- Step 1: Create the is_admin helper function (safe, non-recursive)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: DISABLE RLS temporarily to clear everything
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL policies on profiles (get a fresh start)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, working policies
-- Users can always read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Users can always update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Admins can read all profiles (using safe function)
CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT USING (is_admin());

-- Admins can update all profiles (using safe function)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin());
