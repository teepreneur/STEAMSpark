-- Add role column to distinguish between teachers and parents
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_access_signups' AND column_name = 'role') THEN
        ALTER TABLE public.early_access_signups ADD COLUMN role text DEFAULT 'teacher';
    END IF;
END $$;

-- Make teacher-specific fields nullable
ALTER TABLE public.early_access_signups ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE public.early_access_signups ALTER COLUMN experience DROP NOT NULL;

-- Add parent-specific fields
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_access_signups' AND column_name = 'child_age') THEN
        ALTER TABLE public.early_access_signups ADD COLUMN child_age text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_access_signups' AND column_name = 'interests') THEN
        ALTER TABLE public.early_access_signups ADD COLUMN interests text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_access_signups' AND column_name = 'needs_setup_help') THEN
        ALTER TABLE public.early_access_signups ADD COLUMN needs_setup_help boolean DEFAULT false;
    END IF;
END $$;
