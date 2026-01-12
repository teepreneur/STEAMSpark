-- Teacher Availability Table
-- Stores the weekly recurring availability for each teacher

CREATE TABLE IF NOT EXISTS teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    -- 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(teacher_id, day_of_week)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);

-- Booking Sessions Table (individual session dates for a booking)
-- This allows each session to appear on the calendar separately

CREATE TABLE IF NOT EXISTS booking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by booking and by date
CREATE INDEX IF NOT EXISTS idx_booking_sessions_booking_id ON booking_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_session_date ON booking_sessions(session_date);

-- Enable RLS
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_availability
CREATE POLICY "Teachers can manage their own availability"
    ON teacher_availability FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view teacher availability"
    ON teacher_availability FOR SELECT
    USING (true);

-- RLS Policies for booking_sessions
CREATE POLICY "Teachers can view sessions for their gigs"
    ON booking_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN gigs g ON b.gig_id = g.id
            WHERE b.id = booking_sessions.booking_id
            AND g.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view their booking sessions"
    ON booking_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_sessions.booking_id
            AND b.parent_id = auth.uid()
        )
    );
