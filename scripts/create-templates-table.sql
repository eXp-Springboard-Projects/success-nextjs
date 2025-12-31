-- Create templates table for Template Builder
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  structure JSONB NOT NULL DEFAULT '[]',
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);

-- Enable RLS (Row Level Security)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public templates are viewable by all users"
  ON templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (auth.uid()::text = created_by);

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid()::text = created_by);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid()::text = created_by);
