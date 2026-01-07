-- Add homepage placement tracking table
CREATE TABLE IF NOT EXISTS "homepage_placements" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "zone" TEXT NOT NULL, -- 'hero', 'secondary', 'trending', etc.
    "position" INTEGER NOT NULL DEFAULT 0, -- Order within zone
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "homepage_placements_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "homepage_placements_zone_active_idx" ON "homepage_placements"("zone", "active", "position");
CREATE INDEX IF NOT EXISTS "homepage_placements_postId_idx" ON "homepage_placements"("postId");

-- Add unique constraint to prevent duplicate zone/position
CREATE UNIQUE INDEX IF NOT EXISTS "homepage_placements_zone_position_key" ON "homepage_placements"("zone", "position") WHERE "active" = true;
