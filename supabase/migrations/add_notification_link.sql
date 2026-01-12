-- Add link column to notifications table if not exists
-- This provides a direct link to navigate to when clicking a notification

-- Add link column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Enable realtime for messages table (for live message updates)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
