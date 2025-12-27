-- Add flipbookUrl, status, and totalPages columns to magazines table

-- Add flipbookUrl column to store external flipbook URLs
ALTER TABLE magazines
ADD COLUMN IF NOT EXISTS "flipbookUrl" TEXT;

-- Add status column for publishing control
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
    CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

ALTER TABLE magazines
ADD COLUMN IF NOT EXISTS status "PostStatus" DEFAULT 'PUBLISHED';

-- Add totalPages column
ALTER TABLE magazines
ADD COLUMN IF NOT EXISTS "totalPages" INTEGER DEFAULT 100;

-- Make pdfUrl nullable since we might only have flipbook URLs
ALTER TABLE magazines
ALTER COLUMN "pdfUrl" DROP NOT NULL;

-- Add index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_magazines_status ON magazines(status);

-- Add index on publishedText for date-based queries
CREATE INDEX IF NOT EXISTS idx_magazines_published ON magazines("publishedText");
