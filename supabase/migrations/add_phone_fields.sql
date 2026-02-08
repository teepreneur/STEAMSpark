-- Add phone number fields for WhatsApp integration
-- Run this migration in Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'Primary phone number with country code, e.g. +233xxxxxxxxx';
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'WhatsApp number (can be same as phone_number)';
COMMENT ON COLUMN public.profiles.whatsapp_enabled IS 'Whether user wants WhatsApp notifications';
