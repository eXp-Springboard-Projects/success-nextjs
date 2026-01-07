-- HubSpot to SUCCESS CRM Deal/Opportunity Properties Migration
-- Run this in Supabase SQL Editor

-- Create deals/opportunities table (if doesn't exist)
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY DEFAULT ('deal_' || gen_random_uuid()::text),
  "dealName" TEXT NOT NULL,
  "dealStage" TEXT NOT NULL,
  pipeline TEXT DEFAULT 'default',
  amount NUMERIC,
  "closeDate" TIMESTAMPTZ,
  "ownerId" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add HubSpot deal properties
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS "hubspotDealId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "dealType" TEXT, -- New Business, Existing Business
ADD COLUMN IF NOT EXISTS "dealProbability" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "forecastCategory" TEXT, -- Pipeline, Best Case, Commit, Closed Won
ADD COLUMN IF NOT EXISTS "priority" TEXT, -- Low, Medium, High
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "nextStep" TEXT,

-- Deal status flags
ADD COLUMN IF NOT EXISTS "isClosed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isClosedWon" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isClosedLost" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isStalled" BOOLEAN DEFAULT false,

-- Timeline tracking
ADD COLUMN IF NOT EXISTS "daysToClose" INTEGER,
ADD COLUMN IF NOT EXISTS "actualDuration" INTEGER, -- seconds between create and close
ADD COLUMN IF NOT EXISTS "dateEnteredCurrentStage" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "timeInCurrentStage" INTEGER, -- seconds
ADD COLUMN IF NOT EXISTS "ownerAssignedDate" TIMESTAMPTZ,

-- Revenue calculations
ADD COLUMN IF NOT EXISTS "amountInCompanyCurrency" NUMERIC,
ADD COLUMN IF NOT EXISTS "exchangeRate" NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS "weightedAmount" NUMERIC, -- amount * probability
ADD COLUMN IF NOT EXISTS "weightedAmountInCompanyCurrency" NUMERIC,
ADD COLUMN IF NOT EXISTS "forecastAmount" NUMERIC,
ADD COLUMN IF NOT EXISTS "annualContractValue" NUMERIC, -- ACV
ADD COLUMN IF NOT EXISTS "annualRecurringRevenue" NUMERIC, -- ARR
ADD COLUMN IF NOT EXISTS "monthlyRecurringRevenue" NUMERIC, -- MRR
ADD COLUMN IF NOT EXISTS "totalContractValue" NUMERIC, -- TCV

-- Associations count
ADD COLUMN IF NOT EXISTS "numberOfAssociatedContacts" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "numberOfAssociatedLineItems" INTEGER DEFAULT 0,

-- Activity tracking
ADD COLUMN IF NOT EXISTS "numberOfSalesActivities" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "numberOfTimesContacted" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastActivityDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastContactedDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastMeetingBookedDate" TIMESTAMPTZ,

-- Analytics (from associated contacts)
ADD COLUMN IF NOT EXISTS "originalTrafficSource" TEXT,
ADD COLUMN IF NOT EXISTS "originalTrafficSourceData1" TEXT,
ADD COLUMN IF NOT EXISTS "originalTrafficSourceData2" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSource" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceData1" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceData2" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceTimestamp" TIMESTAMPTZ,

-- E-commerce specific (Unific/WooCommerce)
ADD COLUMN IF NOT EXISTS "orderId" TEXT,
ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
ADD COLUMN IF NOT EXISTS "orderStatus" TEXT, -- pending, processing, completed, cancelled, failed, refunded
ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "grossValueOfOrder" NUMERIC,
ADD COLUMN IF NOT EXISTS "netValueOfOrder" NUMERIC,
ADD COLUMN IF NOT EXISTS "discounts" NUMERIC,
ADD COLUMN IF NOT EXISTS "shipping" NUMERIC,
ADD COLUMN IF NOT EXISTS "tax" NUMERIC,
ADD COLUMN IF NOT EXISTS "couponCodeUsed" TEXT,
ADD COLUMN IF NOT EXISTS "paymentTitle" TEXT,
ADD COLUMN IF NOT EXISTS "shopifyOrderSource" TEXT,
ADD COLUMN IF NOT EXISTS "storeId" TEXT,
ADD COLUMN IF NOT EXISTS "ecommerceDeal" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "abandonedCartUrl" TEXT,
ADD COLUMN IF NOT EXISTS "draftOrderId" TEXT,
ADD COLUMN IF NOT EXISTS "draftOrderName" TEXT,

-- Shipping tracking
ADD COLUMN IF NOT EXISTS "shipmentCarrier" TEXT,
ADD COLUMN IF NOT EXISTS "shipmentDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "orderTrackingNumber" TEXT,

-- Billing and shipping addresses
ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "billingCity" TEXT,
ADD COLUMN IF NOT EXISTS "billingState" TEXT,
ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT,
ADD COLUMN IF NOT EXISTS "billingCountry" TEXT,
ADD COLUMN IF NOT EXISTS "billingPhone" TEXT,
ADD COLUMN IF NOT EXISTS "shippingAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "shippingAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCity" TEXT,
ADD COLUMN IF NOT EXISTS "shippingState" TEXT,
ADD COLUMN IF NOT EXISTS "shippingPostalCode" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCountry" TEXT,
ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT,

-- Products/line items summary
ADD COLUMN IF NOT EXISTS "lastProductsBought" TEXT,
ADD COLUMN IF NOT EXISTS "lastProductTypesBought" TEXT,
ADD COLUMN IF NOT EXISTS "lastSKUsBought" TEXT,
ADD COLUMN IF NOT EXISTS "lastCategoriesBought" TEXT,
ADD COLUMN IF NOT EXISTS "lastTotalNumberOfProductsBought" INTEGER,

-- SUCCESS-specific sales fields
ADD COLUMN IF NOT EXISTS "amountPaid" NUMERIC,
ADD COLUMN IF NOT EXISTS "customerId" TEXT,
ADD COLUMN IF NOT EXISTS "orderDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "salesStatus" TEXT,
ADD COLUMN IF NOT EXISTS "productVariance" TEXT,
ADD COLUMN IF NOT EXISTS "productVariance2" TEXT,
ADD COLUMN IF NOT EXISTS "productName" TEXT,
ADD COLUMN IF NOT EXISTS "productSKU" TEXT,
ADD COLUMN IF NOT EXISTS "quantityOrdered" INTEGER,
ADD COLUMN IF NOT EXISTS "paymentSubscriptionType" TEXT, -- one-time, recurring, subscription
ADD COLUMN IF NOT EXISTS "term" TEXT, -- monthly, annual, etc
ADD COLUMN IF NOT EXISTS "couponDiscount" TEXT,
ADD COLUMN IF NOT EXISTS "giftedRedemptionCoupon" TEXT,

-- Attribution (WooCommerce analytics)
ADD COLUMN IF NOT EXISTS "wooSource" TEXT,
ADD COLUMN IF NOT EXISTS "wooSourceType" TEXT,
ADD COLUMN IF NOT EXISTS "wooMedium" TEXT,
ADD COLUMN IF NOT EXISTS "wooCampaign" TEXT,
ADD COLUMN IF NOT EXISTS "wooDeviceType" TEXT,
ADD COLUMN IF NOT EXISTS "wooSessionPageViews" INTEGER,

-- Mastermind specific
ADD COLUMN IF NOT EXISTS "mastermindOutcome" TEXT, -- Mastermind Ticket, Mastermind Sponsorship, Leadership Downsell
ADD COLUMN IF NOT EXISTS "role" TEXT,
ADD COLUMN IF NOT EXISTS "stateInfo" TEXT,
ADD COLUMN IF NOT EXISTS "expOpportunities" TEXT,

-- Salesforce sync (if applicable)
ADD COLUMN IF NOT EXISTS "salesforceOpportunityId" TEXT,
ADD COLUMN IF NOT EXISTS "opportunityNumber" TEXT,
ADD COLUMN IF NOT EXISTS "budgetConfirmed" BOOLEAN,
ADD COLUMN IF NOT EXISTS "salesProbabilityIndicator" TEXT, -- Warm, Hot, Boiling, Pending Payment, Closed
ADD COLUMN IF NOT EXISTS "leadSourceDetails" TEXT,
ADD COLUMN IF NOT EXISTS "amountAtClosedWon" NUMERIC,
ADD COLUMN IF NOT EXISTS "opPreviouslyClosedWon" BOOLEAN,
ADD COLUMN IF NOT EXISTS "salesforceLastSyncTime" TIMESTAMPTZ,

-- Metadata
ADD COLUMN IF NOT EXISTS "recordSource" TEXT,
ADD COLUMN IF NOT EXISTS "recordSourceDetail1" TEXT,
ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS "teamId" TEXT,
ADD COLUMN IF NOT EXISTS "dealTags" TEXT[],
ADD COLUMN IF NOT EXISTS "syncId" TEXT; -- Unific sync

-- Stage history tracking table
CREATE TABLE IF NOT EXISTS deal_stage_history (
  id TEXT PRIMARY KEY DEFAULT ('dsh_' || gen_random_uuid()::text),
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  pipeline TEXT NOT NULL,
  "dateEntered" TIMESTAMPTZ NOT NULL,
  "dateExited" TIMESTAMPTZ,
  "cumulativeTime" INTEGER DEFAULT 0, -- total seconds in this stage (across re-entries)
  "latestTime" INTEGER DEFAULT 0, -- seconds in this stage for latest entry
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals("ownerId");
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals("dealStage");
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals("closeDate");
CREATE INDEX IF NOT EXISTS idx_deals_is_closed_won ON deals("isClosedWon");
CREATE INDEX IF NOT EXISTS idx_deals_is_closed_lost ON deals("isClosedLost");
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);
CREATE INDEX IF NOT EXISTS idx_deals_hubspot_id ON deals("hubspotDealId");
CREATE INDEX IF NOT EXISTS idx_deals_order_id ON deals("orderId");
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals("customerId");
CREATE INDEX IF NOT EXISTS idx_deals_last_activity ON deals("lastActivityDate");
CREATE INDEX IF NOT EXISTS idx_deals_forecast_category ON deals("forecastCategory");
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal ON deal_stage_history("dealId");

-- Create deal pipelines configuration table
CREATE TABLE IF NOT EXISTS deal_pipelines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create deal stages configuration table
CREATE TABLE IF NOT EXISTS deal_stages (
  id TEXT PRIMARY KEY,
  "pipelineId" TEXT NOT NULL REFERENCES deal_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  probability NUMERIC DEFAULT 0, -- 0-100
  "isClosed" BOOLEAN DEFAULT false,
  "isClosedWon" BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6b7280',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("pipelineId", name)
);

-- Insert default pipeline
INSERT INTO deal_pipelines (id, name, label, "displayOrder", "isDefault") VALUES
('default', 'default', 'Sales Pipeline', 1, true),
('ecommerce', 'ecommerce', 'Ecommerce Pipeline', 2, false),
('woocommerce', 'woocommerce', 'WooCommerce', 3, false),
('coaching', 'coaching', 'SUCCESS Coaching', 4, false),
('mastermind', 'mastermind', 'Mastermind', 5, false)
ON CONFLICT (id) DO NOTHING;

-- Insert default stages for main pipeline
INSERT INTO deal_stages ("pipelineId", id, name, label, "displayOrder", probability) VALUES
('default', 'stage_prospect', 'prospect', 'Prospect', 1, 10),
('default', 'stage_qualified', 'qualified', 'Qualified', 2, 25),
('default', 'stage_meeting_scheduled', 'meeting_scheduled', 'Meeting Scheduled', 3, 40),
('default', 'stage_proposal_sent', 'proposal_sent', 'Proposal Sent', 4, 60),
('default', 'stage_negotiation', 'negotiation', 'Negotiation', 5, 80),
('default', 'stage_closed_won', 'closed_won', 'Closed Won', 6, 100, true, true),
('default', 'stage_closed_lost', 'closed_lost', 'Closed Lost', 7, 0, true, false)
ON CONFLICT ("pipelineId", name) DO NOTHING;

-- Insert ecommerce pipeline stages
INSERT INTO deal_stages ("pipelineId", id, name, label, "displayOrder", probability) VALUES
('ecommerce', 'stage_checkout_pending', 'checkout_pending', 'Checkout Pending', 1, 30),
('ecommerce', 'stage_checkout_abandoned', 'checkout_abandoned', 'Checkout Abandoned', 2, 5),
('ecommerce', 'stage_checkout_completed', 'checkout_completed', 'Checkout Completed', 3, 100, true, true),
('ecommerce', 'stage_processed', 'processed', 'Processed', 4, 100, true, true),
('ecommerce', 'stage_shipped', 'shipped', 'Shipped', 5, 100, true, true)
ON CONFLICT ("pipelineId", name) DO NOTHING;

-- Insert WooCommerce pipeline stages
INSERT INTO deal_stages ("pipelineId", id, name, label, "displayOrder", probability) VALUES
('woocommerce', 'stage_pending', 'pending_payment', 'Pending Payment', 1, 30),
('woocommerce', 'stage_processing', 'processing', 'Processing', 2, 80),
('woocommerce', 'stage_completed', 'completed', 'Completed', 3, 100, true, true),
('woocommerce', 'stage_cancelled', 'cancelled', 'Cancelled', 4, 0, true, false),
('woocommerce', 'stage_failed', 'failed', 'Failed', 5, 0, true, false),
('woocommerce', 'stage_refunded', 'refunded', 'Refunded', 6, 0, true, false)
ON CONFLICT ("pipelineId", name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE deals IS 'Deals/opportunities replacing HubSpot deals';
COMMENT ON TABLE deal_stage_history IS 'Tracks movement through deal stages over time';
COMMENT ON TABLE deal_pipelines IS 'Deal pipeline configurations';
COMMENT ON TABLE deal_stages IS 'Deal stage configurations per pipeline';
COMMENT ON COLUMN deals."dealProbability" IS 'Probability of closing (0-100)';
COMMENT ON COLUMN deals."weightedAmount" IS 'Amount multiplied by probability';
COMMENT ON COLUMN deals."forecastCategory" IS 'Pipeline, Best Case, Commit, Closed Won';
COMMENT ON COLUMN deals."isStalled" IS 'TRUE if 20% longer than average time in stage';
COMMENT ON COLUMN deals."ecommerceDeal" IS 'TRUE if synced from e-commerce platform';
COMMENT ON COLUMN deals."paymentSubscriptionType" IS 'one-time, recurring, subscription';
COMMENT ON COLUMN deals."mastermindOutcome" IS 'Mastermind Ticket, Sponsorship, or Leadership Downsell';
