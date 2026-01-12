-- Create table for About Us page content
CREATE TABLE IF NOT EXISTS "about_page_content" (
    "id" TEXT NOT NULL,
    "heroVideoUrl" TEXT,
    "historyItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "about_page_content_pkey" PRIMARY KEY ("id")
);

-- Insert default content with existing hardcoded history
INSERT INTO "about_page_content" ("id", "heroVideoUrl", "historyItems", "updatedAt")
VALUES (
    'about-us-page',
    'https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1',
    '[
        {
            "year": "1897",
            "description": "Hotelier and author Orison Swett Marden sat in a small bedroom on Bowdoin Street in Boston churning out the very first issue of SUCCESS magazine."
        },
        {
            "year": "1930s",
            "description": "Think and Grow Rich by Napoleon Hill and How to Win Friends and Influence People by Dale Carnegie are published, which, along with SUCCESS, helped form the foundation of personal development."
        },
        {
            "year": "1954-1980",
            "description": "Napoleon Hill and W. Clement Stone, another writer and major personal development figure at the time, published the magazine as the rebranded SUCCESS Unlimited, eventually returning to its roots as SUCCESS."
        },
        {
            "year": "2008",
            "description": "After an acquisition by VideoPlus (later renamed SUCCESS Partners), the magazine was completely relaunched, bolstered for the first time by SUCCESS.com."
        },
        {
            "year": "2020",
            "description": "SUCCESS Enterprises was acquired by eXp World Holdings, the parent company of eXp Realty."
        },
        {
            "year": "TODAY",
            "description": "SUCCESS Enterprises continues to be the authority in personal and professional development with SUCCESS magazine, in addition to the recently launched The SUCCESS Magazine Podcast and SUCCESS+, a digital-only magazine."
        }
    ]'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "about_page_content_id_idx" ON "about_page_content"("id");
