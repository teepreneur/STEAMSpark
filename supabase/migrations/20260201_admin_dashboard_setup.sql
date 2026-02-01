-- Admin Dashboard Database Setup
-- Adds admin role, support tickets, and admin activity logging

-- 1. Update profiles role to include 'admin'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('teacher', 'parent', 'admin'));

-- 2. Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'teacher', 'parent', 'booking', 'gig', 'ticket'
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for support_tickets
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (created_by = auth.uid());

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Admins have full access to tickets
CREATE POLICY "Admins can manage all tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. RLS Policies for admin_logs
-- Only admins can view and create logs
CREATE POLICY "Admins can view logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 7. Admin override policies for existing tables
-- Allow admins to update any booking
DROP POLICY IF EXISTS "Participants can update bookings" ON bookings;
CREATE POLICY "Participants and admins can update bookings" ON bookings
    FOR UPDATE USING (
        auth.uid() = parent_id 
        OR EXISTS (
            SELECT 1 FROM gigs WHERE gigs.id = bookings.gig_id AND gigs.teacher_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Allow admins to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update profiles" ON profiles
    FOR UPDATE USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Allow admins to view all gigs
DROP POLICY IF EXISTS "Anyone can view gigs" ON gigs;
CREATE POLICY "Anyone can view gigs" ON gigs
    FOR SELECT USING (true);

-- Allow admins to manage any gig
DROP POLICY IF EXISTS "Teachers can manage own gigs" ON gigs;
CREATE POLICY "Teachers and admins can manage gigs" ON gigs
    FOR ALL USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow admins to view all students
DROP POLICY IF EXISTS "Parents can manage own students" ON students;
CREATE POLICY "Parents and admins can manage students" ON students
    FOR ALL USING (
        parent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Allow admins to view all bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = parent_id 
        OR EXISTS (
            SELECT 1 FROM gigs WHERE gigs.id = bookings.gig_id AND gigs.teacher_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
