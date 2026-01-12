-- Payment flow redesign: escrow, markup, and teacher earnings

-- Add payment tracking columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS teacher_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS company_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'; -- 'unpaid' | 'paid' | 'refunded'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add meeting link to booking sessions
ALTER TABLE booking_sessions ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Add class type and meeting platform to gigs
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'online';
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS meeting_platform TEXT;

-- Add link column to notifications (for clickable notifications)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Teacher earnings tracking (released per 2 completed sessions)
CREATE TABLE IF NOT EXISTS teacher_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES profiles(id) NOT NULL,
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    sessions_required INT NOT NULL, -- sessions that must be completed for this earning
    sessions_completed INT DEFAULT 0,
    status TEXT DEFAULT 'held', -- 'held' | 'available' | 'withdrawn'
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for teacher_earnings
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own earnings" ON teacher_earnings;
CREATE POLICY "Teachers can view own earnings" ON teacher_earnings
    FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "System can insert earnings" ON teacher_earnings;
CREATE POLICY "System can insert earnings" ON teacher_earnings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update earnings" ON teacher_earnings;
CREATE POLICY "System can update earnings" ON teacher_earnings
    FOR UPDATE USING (true);
