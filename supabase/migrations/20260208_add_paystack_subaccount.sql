-- Add Paystack subaccount column for split payments
-- Each teacher can have their own Paystack subaccount for direct payouts

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

COMMENT ON COLUMN profiles.paystack_subaccount_code IS 'Paystack subaccount code for split payments';
COMMENT ON COLUMN profiles.bank_name IS 'Teacher bank name for payouts';
COMMENT ON COLUMN profiles.bank_account_number IS 'Teacher bank account number';
COMMENT ON COLUMN profiles.bank_account_name IS 'Name on the bank account';

-- Index for quick lookup 
CREATE INDEX IF NOT EXISTS idx_profiles_paystack_subaccount ON profiles(paystack_subaccount_code) 
WHERE paystack_subaccount_code IS NOT NULL;
