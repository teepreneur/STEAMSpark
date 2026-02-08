-- Add material_type and link_type columns to materials table
-- This allows materials to be either file uploads or external links

ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'file' CHECK (material_type IN ('file', 'link'));

ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS link_type TEXT CHECK (link_type IN ('youtube', 'google_drive', 'website', 'other'));

-- Make file_url allow links as well (already exists, just updating comment)
COMMENT ON COLUMN materials.file_url IS 'URL to the file in storage or external link URL';

-- Add index for material_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_materials_material_type ON materials(material_type);
