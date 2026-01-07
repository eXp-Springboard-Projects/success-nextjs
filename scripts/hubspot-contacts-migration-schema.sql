-- HubSpot to SUCCESS CRM Contact Properties Migration
-- Run this in Supabase SQL Editor to add HubSpot-equivalent fields

-- Core contact fields (already exist in most CRMs)
-- email, firstName, lastName, phone, company, jobTitle, city, state, zip, country, address

-- Add HubSpot-specific contact properties to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "hubspotScore" INTEGER,
ADD COLUMN IF NOT EXISTS "lifecycleStage" TEXT DEFAULT 'subscriber',
ADD COLUMN IF NOT EXISTS "leadStatus" TEXT,
ADD COLUMN IF NOT EXISTS "contactPriority" TEXT, -- Very High, High, Medium, Low, Closed Won
ADD COLUMN IF NOT EXISTS "contactUnworked" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "marketingContactStatus" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "timezone" TEXT,
ADD COLUMN IF NOT EXISTS "ipCountry" TEXT,
ADD COLUMN IF NOT EXISTS "ipCountryCode" TEXT,
ADD COLUMN IF NOT EXISTS "ipState" TEXT,
ADD COLUMN IF NOT EXISTS "ipCity" TEXT,
ADD COLUMN IF NOT EXISTS "mobilePhone" TEXT,
ADD COLUMN IF NOT EXISTS "streetAddress2" TEXT,
ADD COLUMN IF NOT EXISTS "legalBasis" TEXT, -- GDPR compliance
ADD COLUMN IF NOT EXISTS "closeDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "daysToClose" INTEGER,
ADD COLUMN IF NOT EXISTS "netWorth" TEXT,
ADD COLUMN IF NOT EXISTS "growthInvestment" TEXT,
ADD COLUMN IF NOT EXISTS "coachingContact" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsOptInOut" TEXT DEFAULT 'opt-out',
ADD COLUMN IF NOT EXISTS "emailValidationStatus" TEXT,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "agentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "expEntity" TEXT,
ADD COLUMN IF NOT EXISTS "primaryStateLicensed" TEXT;

-- SUCCESS+ specific fields
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "successPlusMemberPortalStatus" TEXT,
ADD COLUMN IF NOT EXISTS "successPlusMembershipStartDate" DATE,
ADD COLUMN IF NOT EXISTS "successPlusPrintMagazine" TEXT,
ADD COLUMN IF NOT EXISTS "successPlusPrintMagazineLength" TEXT,
ADD COLUMN IF NOT EXISTS "successMagazineSubscriber" TEXT, -- Active, Cancelled, Expired
ADD COLUMN IF NOT EXISTS "successMagazineNumberOfRenewals" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "successMagazineSubscriptionStartIssue" TEXT,
ADD COLUMN IF NOT EXISTS "successMagazineSubscriptionEndIssue" TEXT,
ADD COLUMN IF NOT EXISTS "successMagazineSubscriptionType" TEXT, -- Print, Digital, Print & Digital
ADD COLUMN IF NOT EXISTS "encryptionToken" TEXT,
ADD COLUMN IF NOT EXISTS "hubspotRecordLink" TEXT,
ADD COLUMN IF NOT EXISTS "discUserId" TEXT,
ADD COLUMN IF NOT EXISTS "discBehavior" TEXT,
ADD COLUMN IF NOT EXISTS "discResultsPdfLink" TEXT,
ADD COLUMN IF NOT EXISTS "courseProgressionEnrolled" TEXT,
ADD COLUMN IF NOT EXISTS "courseProgressionCurrentLevel" TEXT;

-- Analytics and engagement tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "averagePageviews" NUMERIC,
ADD COLUMN IF NOT EXISTS "numberOfPageviews" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "numberOfSessions" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "eventRevenue" NUMERIC,
ADD COLUMN IF NOT EXISTS "numberOfEventCompletions" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "originalTrafficSource" TEXT,
ADD COLUMN IF NOT EXISTS "originalTrafficSourceData1" TEXT,
ADD COLUMN IF NOT EXISTS "originalTrafficSourceData2" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSource" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceData1" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceData2" TEXT,
ADD COLUMN IF NOT EXISTS "latestTrafficSourceTimestamp" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "firstPageSeen" TEXT,
ADD COLUMN IF NOT EXISTS "lastPageSeen" TEXT,
ADD COLUMN IF NOT EXISTS "timeFirstSeen" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "timeLastSeen" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "firstReferrer" TEXT,
ADD COLUMN IF NOT EXISTS "lastReferrer" TEXT,
ADD COLUMN IF NOT EXISTS "firstConversionEventName" TEXT,
ADD COLUMN IF NOT EXISTS "firstConversionDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "recentConversionEventName" TEXT;

-- Email engagement (already have some in email_preferences)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "lastMarketingEmailName" TEXT,
ADD COLUMN IF NOT EXISTS "lastMarketingEmailSendDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastMarketingEmailOpenDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastMarketingEmailClickDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "marketingEmailsDelivered" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "marketingEmailsOpened" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "marketingEmailsClicked" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "marketingEmailsBounced" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "sendsSinceLastEngagement" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "emailHardBounceReason" TEXT;

-- Sales activity tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "numberOfSalesActivities" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "numberOfTimesContacted" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastActivityDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastContactedDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastEngagementDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "recentSalesEmailRepliedDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "recentSalesEmailOpenedDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "dateOfFirstEngagement" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "descriptionOfFirstEngagement" TEXT,
ADD COLUMN IF NOT EXISTS "typeOfFirstEngagement" TEXT,
ADD COLUMN IF NOT EXISTS "leadResponseTime" INTEGER; -- in seconds

-- Deal/revenue tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "numberOfAssociatedDeals" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "firstDealCreatedDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "recentDealAmount" NUMERIC,
ADD COLUMN IF NOT EXISTS "recentDealCloseDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "totalRevenue" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "timeBetweenContactCreationAndDealCreation" INTEGER,
ADD COLUMN IF NOT EXISTS "timeBetweenContactCreationAndDealClose" INTEGER,
ADD COLUMN IF NOT EXISTS "timeToMoveFromLeadToCustomer" INTEGER,
ADD COLUMN IF NOT EXISTS "timeToMoveFromSubscriberToCustomer" INTEGER,
ADD COLUMN IF NOT EXISTS "timeToMoveFromOpportunityToCustomer" INTEGER;

-- Lifecycle stage tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "dateEnteredSubscriber" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "dateExitedSubscriber" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "cumulativeTimeInSubscriber" INTEGER,
ADD COLUMN IF NOT EXISTS "latestTimeInSubscriber" INTEGER,
ADD COLUMN IF NOT EXISTS "dateEnteredLead" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "dateExitedLead" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "cumulativeTimeInLead" INTEGER,
ADD COLUMN IF NOT EXISTS "latestTimeInLead" INTEGER,
ADD COLUMN IF NOT EXISTS "dateEnteredOpportunity" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "dateExitedOpportunity" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "cumulativeTimeInOpportunity" INTEGER,
ADD COLUMN IF NOT EXISTS "latestTimeInOpportunity" INTEGER,
ADD COLUMN IF NOT EXISTS "dateEnteredCustomer" TIMESTAMPTZ;

-- UTM parameters
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
ADD COLUMN IF NOT EXISTS "utmContent" TEXT,
ADD COLUMN IF NOT EXISTS "utmTerm" TEXT,
ADD COLUMN IF NOT EXISTS "utmAffiliate" TEXT,
ADD COLUMN IF NOT EXISTS "firstTouchConvertingCampaign" TEXT,
ADD COLUMN IF NOT EXISTS "lastTouchConvertingCampaign" TEXT;

-- Event/webinar tracking
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "bigMarkerId" TEXT,
ADD COLUMN IF NOT EXISTS "bigMarkerWebinarId" TEXT,
ADD COLUMN IF NOT EXISTS "bigMarkerPersonalizedUrl" TEXT,
ADD COLUMN IF NOT EXISTS "bigMarkerEnteredTime" TEXT,
ADD COLUMN IF NOT EXISTS "bigMarkerExitedTime" TEXT,
ADD COLUMN IF NOT EXISTS "bigMarkerAttendDuration" TEXT,
ADD COLUMN IF NOT EXISTS "registeredEventId" TEXT;

-- SMS tracking (some may exist in separate SMS tables)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "lastSentSmsDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastReceivedSmsDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "totalSentSms" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalReceivedSms" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "smsOptOutDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "smsQuotesOptIn" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastMessageReceivedContent" TEXT,
ADD COLUMN IF NOT EXISTS "linkClicks" TEXT;

-- Newsletter/subscription preferences (some in email_preferences)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "insideNewsletter" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "dateUnsubFromAllEmail" DATE;

-- Lead generation & funnels
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "leadSource" TEXT,
ADD COLUMN IF NOT EXISTS "newsletterChoice" TEXT,
ADD COLUMN IF NOT EXISTS "mastermindLeadType" TEXT,
ADD COLUMN IF NOT EXISTS "companyIndustry" TEXT,
ADD COLUMN IF NOT EXISTS "pastMastermindExperience" TEXT;

-- E-commerce (if using Unific/WooCommerce integration)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS "shippingAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "shippingAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCity" TEXT,
ADD COLUMN IF NOT EXISTS "shippingState" TEXT,
ADD COLUMN IF NOT EXISTS "shippingPostalCode" TEXT,
ADD COLUMN IF NOT EXISTS "shippingCountry" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "billingCity" TEXT,
ADD COLUMN IF NOT EXISTS "billingState" TEXT,
ADD COLUMN IF NOT EXISTS "billingPostalCode" TEXT,
ADD COLUMN IF NOT EXISTS "billingCountry" TEXT,
ADD COLUMN IF NOT EXISTS "firstOrderDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "lastOrderDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "firstOrderValue" NUMERIC,
ADD COLUMN IF NOT EXISTS "lastOrderValue" NUMERIC,
ADD COLUMN IF NOT EXISTS "averageOrderValue" NUMERIC,
ADD COLUMN IF NOT EXISTS "totalValueOfOrders" NUMERIC,
ADD COLUMN IF NOT EXISTS "unpaidOrdersCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "productsBought" TEXT,
ADD COLUMN IF NOT EXISTS "abandonedCartDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "abandonedCartValue" NUMERIC;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON contacts("lifecycleStage");
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts("leadStatus");
CREATE INDEX IF NOT EXISTS idx_contacts_marketing_status ON contacts("marketingContactStatus");
CREATE INDEX IF NOT EXISTS idx_contacts_success_plus_status ON contacts("successPlusMemberPortalStatus");
CREATE INDEX IF NOT EXISTS idx_contacts_hubspot_score ON contacts("hubspotScore");
CREATE INDEX IF NOT EXISTS idx_contacts_contact_priority ON contacts("contactPriority");
CREATE INDEX IF NOT EXISTS idx_contacts_stripe_customer ON contacts("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts("lastActivityDate");

-- Comments for documentation
COMMENT ON COLUMN contacts."hubspotScore" IS 'Lead qualification score (0-100)';
COMMENT ON COLUMN contacts."lifecycleStage" IS 'subscriber, lead, opportunity, customer';
COMMENT ON COLUMN contacts."contactPriority" IS 'AI-predicted likelihood to convert: Very High, High, Medium, Low, Closed Won';
COMMENT ON COLUMN contacts."marketingContactStatus" IS 'TRUE = marketing contact, FALSE = non-marketing contact';
COMMENT ON COLUMN contacts."legalBasis" IS 'GDPR legal basis for processing';
COMMENT ON COLUMN contacts."successPlusMemberPortalStatus" IS 'Member portal access status';
COMMENT ON COLUMN contacts."emailValidationStatus" IS 'Email validation result from verification service';
