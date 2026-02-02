-- Fix RLS infinite recursion issue
-- The admin policies were checking profiles table to verify admin role,
-- but that check itself requires accessing profiles, causing infinite recursion.

-- Solution: Use a security definer function to check admin role

-- 1. Create a function to check if user is admin (runs with elevated privileges)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all gigs" ON gigs;
DROP POLICY IF EXISTS "Admins can view all students" ON students;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;

-- 3. Recreate policies using the security definer function
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all gigs" ON gigs
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all students" ON students
    FOR SELECT USING (is_admin());

-- Support tickets policies
CREATE POLICY "Admins can manage all tickets" ON support_tickets
    FOR ALL USING (is_admin());

CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Admin logs policies
CREATE POLICY "Admins can view all logs" ON admin_logs
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (is_admin());
