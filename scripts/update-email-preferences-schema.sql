-- Update email_preferences table to match new HubSpot replacement structure
-- Run this in Supabase SQL Editor

-- Add new subscription type columns
ALTER TABLE email_preferences
ADD COLUMN IF NOT EXISTS "optInInsideSuccess" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "optInCustomerService" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "optInSuccessUpdates" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "optInOneToOne" BOOLEAN DEFAULT true;

-- Comment on columns for documentation
COMMENT ON COLUMN email_preferences."optInInsideSuccess" IS 'Inside SUCCESS: Stay informed with curated articles, trends, tips, and expert insights';
COMMENT ON COLUMN email_preferences."optInCustomerService" IS 'Customer Service: Feedback requests and customer service information';
COMMENT ON COLUMN email_preferences."optInSuccessUpdates" IS 'SUCCESS Updates: Latest opportunities, events, webinars, courses, resources';
COMMENT ON COLUMN email_preferences."optInOneToOne" IS 'One to One: Direct one-to-one emails';

-- Note: optInTransactional is always true and doesn't need a column
-- Transactional emails (account signup, receipts, invoices, password changes) are always sent

-- Migrate old data if exists
UPDATE email_preferences
SET
  "optInInsideSuccess" = COALESCE("optInNewsletter", true),
  "optInSuccessUpdates" = COALESCE("optInMarketing", true)
WHERE "optInInsideSuccess" IS NULL OR "optInSuccessUpdates" IS NULL;
