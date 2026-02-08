-- Teacher payouts tracking table
CREATE TABLE IF NOT EXISTS teacher_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    paystack_transfer_code TEXT,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    earnings_ids UUID[] DEFAULT '{}',
    payout_method TEXT, -- mobile_money or bank
    payout_details TEXT, -- e.g. "MTN - 0241234567" or "GCB Bank - 1234567890"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add paystack recipient code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT;

-- Add payout tracking columns to teacher_earnings
ALTER TABLE teacher_earnings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE teacher_earnings ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher_id ON teacher_payouts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_status ON teacher_payouts(status);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(status);

-- Comments
COMMENT ON TABLE teacher_payouts IS 'Records of payouts made to teachers via Paystack Transfers';
COMMENT ON COLUMN teacher_payouts.earnings_ids IS 'Array of teacher_earnings IDs covered by this payout';
