-- Migration: Create roadmaps table for AI-powered learning paths
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  career_goal TEXT,
  description TEXT,
  modules JSONB DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  next_step TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  estimated_duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_roadmaps_parent ON roadmaps(parent_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_student ON roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);

-- Enable RLS
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can only see their own roadmaps
CREATE POLICY "Parents can view own roadmaps" ON roadmaps
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own roadmaps" ON roadmaps
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own roadmaps" ON roadmaps
  FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own roadmaps" ON roadmaps
  FOR DELETE USING (auth.uid() = parent_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roadmaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS roadmaps_updated_at ON roadmaps;
CREATE TRIGGER roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmaps_updated_at();
