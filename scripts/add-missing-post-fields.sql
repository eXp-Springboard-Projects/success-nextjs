-- ===================================================================
-- Add Missing Fields to Posts Table
-- Fixes: contentPillar schema error, author attribution, AI generation
-- ===================================================================

-- 1. Add contentPillar field (CRITICAL - fixes schema cache error)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "contentPillar" TEXT;

-- 2. Add AI excerpt tracking fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "excerptGeneratedBy" TEXT DEFAULT 'manual';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "excerptGeneratedAt" TIMESTAMP(3);

-- 3. Add separate author name field (fixes author attribution bug)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "authorName" TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "authorSlug" TEXT;

-- 4. Add created_by/updated_by for admin tracking (separate from author)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- 5. Add homepage display toggles
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "featureOnHomepage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "featureInPillarSection" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "showInTrending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "mainFeaturedArticle" BOOLEAN NOT NULL DEFAULT false;

-- 6. Add contentType field
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "contentType" TEXT DEFAULT 'regular';

-- 7. Add scheduledFor field
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3);

-- 8. Add custom author ID (for linking to authors table if we create one)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS "customAuthorId" TEXT;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS "posts_contentPillar_idx" ON posts("contentPillar");
CREATE INDEX IF NOT EXISTS "posts_authorName_idx" ON posts("authorName");
CREATE INDEX IF NOT EXISTS "posts_featureOnHomepage_idx" ON posts("featureOnHomepage");

-- 10. Migrate existing data
-- Copy authorId to createdBy for audit trail
UPDATE posts SET "createdBy" = "authorId" WHERE "createdBy" IS NULL;

-- Copy wordpressAuthor to authorName if available
UPDATE posts SET "authorName" = "wordpressAuthor" WHERE "wordpressAuthor" IS NOT NULL AND "authorName" IS NULL;
