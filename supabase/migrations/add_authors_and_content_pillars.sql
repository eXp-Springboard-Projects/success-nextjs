-- ========================================
-- Add Authors Table and Content Management Fields
-- ========================================

-- Create Content Pillar Enum
CREATE TYPE "ContentPillar" AS ENUM (
  'AI_TECHNOLOGY',
  'BUSINESS_BRANDING',
  'CULTURE_WORKPLACE',
  'ENTREPRENEURSHIP',
  'LEADERSHIP',
  'LONGEVITY_PERFORMANCE',
  'MONEY',
  'PHILANTHROPY',
  'PROFESSIONAL_GROWTH',
  'TRENDS_INSIGHTS'
);

-- Create Authors Table
CREATE TABLE IF NOT EXISTS "authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "photo" TEXT,
    "email" TEXT,
    "title" TEXT,
    "socialLinkedin" TEXT,
    "socialTwitter" TEXT,
    "socialFacebook" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "wordpressId" INTEGER,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS "authors_slug_key" ON "authors"("slug");

-- Add index on wordpressId for lookups
CREATE INDEX IF NOT EXISTS "authors_wordpressId_idx" ON "authors"("wordpressId");

-- Add new fields to posts table
ALTER TABLE "posts"
ADD COLUMN IF NOT EXISTS "contentPillar" "ContentPillar",
ADD COLUMN IF NOT EXISTS "customAuthorId" TEXT,
ADD COLUMN IF NOT EXISTS "featureOnHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "featureInPillar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "featureTrending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mainFeaturedArticle" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign key constraint for customAuthorId
ALTER TABLE "posts"
ADD CONSTRAINT "posts_customAuthorId_fkey"
FOREIGN KEY ("customAuthorId") REFERENCES "authors"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on contentPillar for filtering
CREATE INDEX IF NOT EXISTS "posts_contentPillar_idx" ON "posts"("contentPillar");

-- Add index on customAuthorId for author page queries
CREATE INDEX IF NOT EXISTS "posts_customAuthorId_idx" ON "posts"("customAuthorId");

-- Add composite index for featured articles queries
CREATE INDEX IF NOT EXISTS "posts_featured_idx"
ON "posts"("featureOnHomepage", "featureInPillar", "featureTrending", "mainFeaturedArticle", "status", "publishedAt");

-- Add unique constraint to ensure only one main featured article is active at a time
CREATE UNIQUE INDEX IF NOT EXISTS "posts_main_featured_unique"
ON "posts"("mainFeaturedArticle")
WHERE "mainFeaturedArticle" = true AND "status" = 'PUBLISHED';

-- Add comment explaining the content pillar enum values
COMMENT ON TYPE "ContentPillar" IS 'Content pillars for article categorization: AI & Technology, Business & Branding, Culture & Workplace, Entrepreneurship, Leadership, Longevity & Performance, Money, Philanthropy, Professional Growth, Trends & Insights';
