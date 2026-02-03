-- Create support_chats table
CREATE TABLE IF NOT EXISTS support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default setting
INSERT INTO admin_settings (key, value)
VALUES ('is_support_online', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Ensure columns exist (in case table was created previously without them)
ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'));

ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- Fix RLS infinite recursion issue (Inline definition for safety)
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

-- Re-enable RLS
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own chats" ON support_chats;
DROP POLICY IF EXISTS "Users can create own chats" ON support_chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON support_chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON support_chats;

DROP POLICY IF EXISTS "Users can view messages in own chats" ON support_messages;
DROP POLICY IF EXISTS "Users can send messages to own chats" ON support_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON support_messages;

DROP POLICY IF EXISTS "Everyone can read support status" ON admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON admin_settings;

-- Re-create Policies
CREATE POLICY "Users can view own chats" ON support_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chats" ON support_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all chats" ON support_chats FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all chats" ON support_chats FOR UPDATE USING (is_admin());

CREATE POLICY "Users can view messages in own chats" ON support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid())
);
CREATE POLICY "Users can send messages to own chats" ON support_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_chats WHERE support_chats.id = support_messages.chat_id AND support_chats.user_id = auth.uid())
);
CREATE POLICY "Admins can view all messages" ON support_messages FOR SELECT USING (is_admin());
CREATE POLICY "Admins can send messages" ON support_messages FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Everyone can read support status" ON admin_settings FOR SELECT USING (key = 'is_support_online');
CREATE POLICY "Admins can update settings" ON admin_settings FOR ALL USING (is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE ON support_chats TO authenticated;
GRANT SELECT, INSERT ON support_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_settings TO authenticated;
GRANT ALL ON admin_settings TO service_role;
