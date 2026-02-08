-- Add payout details columns for teacher payments
-- Supports both Mobile Money and Bank Transfer

-- Payout method preference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'mobile_money';

-- Mobile Money fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS momo_name TEXT;

-- Bank Transfer fields  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Comments
COMMENT ON COLUMN profiles.payout_method IS 'Preferred payout method: mobile_money or bank';
COMMENT ON COLUMN profiles.momo_provider IS 'Mobile money provider: MTN, Vodafone, AirtelTigo';
COMMENT ON COLUMN profiles.momo_number IS 'Mobile money phone number';
COMMENT ON COLUMN profiles.momo_name IS 'Name registered on mobile money account';
COMMENT ON COLUMN profiles.bank_name IS 'Bank name for payouts';
COMMENT ON COLUMN profiles.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN profiles.bank_account_name IS 'Name on bank account';
