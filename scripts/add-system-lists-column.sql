-- Add isSystem flag to contact_lists table for system-managed lists

ALTER TABLE contact_lists
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT false;

COMMENT ON COLUMN contact_lists."isSystem" IS 'System-managed lists that cannot be deleted by users';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_lists_is_system ON contact_lists("isSystem");
