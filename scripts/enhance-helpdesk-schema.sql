-- Enhance CRM ticket system for Help Desk requirements (HubSpot replacement)
-- Run this in Supabase SQL Editor

-- Update tickets table with new V1 requirements
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS "emailSource" TEXT,              -- Email address where ticket originated
ADD COLUMN IF NOT EXISTS "folder" TEXT DEFAULT 'inbox',   -- Folder organization (inbox, archive, etc.)
ADD COLUMN IF NOT EXISTS "attachments" JSONB DEFAULT '[]',-- Store attachment metadata
ADD COLUMN IF NOT EXISTS "internalNotes" JSONB DEFAULT '[]', -- Internal team comments not visible to customer
ADD COLUMN IF NOT EXISTS "ownerId" TEXT,                  -- Assigned ticket owner
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}';      -- Tags for categorization

-- Update status enum to match new customizable statuses
-- Note: Kristen can edit these as needed via admin interface
COMMENT ON COLUMN tickets.status IS 'Customizable statuses: new, open, waiting_vendor, waiting_cs, waiting_customer, closed';

-- Create ticket_statuses configuration table for admin-editable statuses
CREATE TABLE IF NOT EXISTS ticket_statuses (
  id TEXT PRIMARY KEY DEFAULT ('status_' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  color TEXT DEFAULT '#6b7280',
  "isDefault" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default statuses matching requirements
INSERT INTO ticket_statuses (name, label, "displayOrder", color, "isDefault") VALUES
('new', 'New', 1, '#3b82f6', true),
('open', 'Open', 2, '#10b981', false),
('waiting_vendor', 'Waiting on Vendor', 3, '#f59e0b', false),
('waiting_cs', 'Waiting on CS Agent', 4, '#ef4444', false),
('waiting_customer', 'Waiting on Customer', 5, '#8b5cf6', false),
('closed', 'Closed', 6, '#6b7280', false)
ON CONFLICT (name) DO NOTHING;

-- Create ticket_folders table for folder organization
CREATE TABLE IF NOT EXISTS ticket_folders (
  id TEXT PRIMARY KEY DEFAULT ('folder_' || gen_random_uuid()::text),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT,
  "displayOrder" INTEGER DEFAULT 0,
  "isSystem" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default folders
INSERT INTO ticket_folders (name, label, icon, "displayOrder", "isSystem") VALUES
('inbox', 'Inbox', '📥', 1, true),
('assigned', 'Assigned to Me', '👤', 2, true),
('pending', 'Pending', '⏳', 3, true),
('resolved', 'Resolved', '✅', 4, true),
('archive', 'Archive', '📦', 5, true)
ON CONFLICT (name) DO NOTHING;

-- Create ticket_internal_notes table for internal team communication
CREATE TABLE IF NOT EXISTS ticket_internal_notes (
  id TEXT PRIMARY KEY DEFAULT ('note_' || gen_random_uuid()::text),
  "ticketId" TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket_attachments table for file tracking
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id TEXT PRIMARY KEY DEFAULT ('attach_' || gen_random_uuid()::text),
  "ticketId" TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  "messageId" TEXT,  -- Link to specific message if from email
  filename TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "uploadedBy" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_email_source ON tickets("emailSource");
CREATE INDEX IF NOT EXISTS idx_tickets_folder ON tickets(folder);
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets("ownerId");
CREATE INDEX IF NOT EXISTS idx_tickets_tags ON tickets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_ticket_internal_notes_ticket ON ticket_internal_notes("ticketId");
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments("ticketId");

-- Add foreign key for ticket owner
ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_owner
FOREIGN KEY ("ownerId") REFERENCES users(id) ON DELETE SET NULL;

-- Comments for documentation
COMMENT ON TABLE ticket_statuses IS 'Admin-editable ticket statuses (V1 requirement)';
COMMENT ON TABLE ticket_folders IS 'Folder organization for tickets (V1 requirement)';
COMMENT ON TABLE ticket_internal_notes IS 'Internal team communication not visible to customers (V1 requirement)';
COMMENT ON TABLE ticket_attachments IS 'File attachments from customer emails (V1 requirement)';
COMMENT ON COLUMN tickets."emailSource" IS 'Email address/group where ticket originated (for Google group integration)';
COMMENT ON COLUMN tickets."ownerId" IS 'Assigned ticket owner responsible for customer reply (V1 requirement)';
COMMENT ON COLUMN tickets.folder IS 'Current folder location (V1 requirement)';
