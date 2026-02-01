-- Create materials table for teacher uploads
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT, -- pdf, video, image, document
    file_size BIGINT,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'enrolled_students', 'public')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own materials
CREATE POLICY "Teachers can manage own materials"
    ON materials FOR ALL
    USING (auth.uid() = teacher_id);

-- Parents can view materials shared with enrolled students
CREATE POLICY "Parents can view shared materials"
    ON materials FOR SELECT
    USING (
        visibility = 'public'
        OR (
            visibility = 'enrolled_students'
            AND EXISTS (
                SELECT 1 FROM bookings b
                JOIN students s ON b.student_id = s.id
                WHERE b.gig_id = materials.gig_id
                AND s.parent_id = auth.uid()
                AND b.status IN ('confirmed', 'completed')
            )
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_gig_id ON materials(gig_id);
