-- Complaints table for session issues
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES booking_sessions(id),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    type TEXT NOT NULL, -- 'session_issue' | 'teacher_issue' | 'payment_issue' | 'other'
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved'
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
CREATE POLICY "Users can view own complaints" ON complaints
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
CREATE POLICY "Users can create complaints" ON complaints
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can update complaints" ON complaints;
CREATE POLICY "System can update complaints" ON complaints
    FOR UPDATE USING (true);
