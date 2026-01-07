-- Workflow Automation Infrastructure for HubSpot Migration
-- Run this in Supabase SQL Editor

-- ============================================================
-- WORKFLOW TRACKING
-- ============================================================

-- Track workflow executions (replaces HubSpot workflow enrollment)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY DEFAULT ('wf_' || gen_random_uuid()::text),
  "workflowName" TEXT NOT NULL,
  "workflowType" TEXT NOT NULL, -- email_automation, subscription_management, sync, etc
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "dealId" TEXT REFERENCES deals(id) ON DELETE CASCADE,
  "ticketId" TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  "enrolledAt" TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "currentStep" TEXT,
  status TEXT DEFAULT 'active', -- active, completed, failed, unenrolled
  "stepHistory" JSONB DEFAULT '[]',
  error TEXT,
  "triggerSource" TEXT, -- manual, automatic, webhook, scheduled
  "triggeredBy" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_contact ON workflow_executions("contactId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_deal ON workflow_executions("dealId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_ticket ON workflow_executions("ticketId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions("workflowName");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type ON workflow_executions("workflowType");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_enrolled ON workflow_executions("enrolledAt");

COMMENT ON TABLE workflow_executions IS 'Tracks all workflow executions - replaces HubSpot workflow enrollment';
COMMENT ON COLUMN workflow_executions."stepHistory" IS 'JSON array of completed steps with timestamps';

-- ============================================================
-- SCHEDULED ACTIONS
-- ============================================================

-- Handle delayed workflow actions (replaces HubSpot delays)
CREATE TABLE IF NOT EXISTS scheduled_actions (
  id TEXT PRIMARY KEY DEFAULT ('action_' || gen_random_uuid()::text),
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "dealId" TEXT REFERENCES deals(id) ON DELETE CASCADE,
  "ticketId" TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  "workflowExecutionId" TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
  "actionType" TEXT NOT NULL, -- send_email, update_property, add_to_list, send_sms, etc
  "actionData" JSONB NOT NULL,
  "scheduledFor" TIMESTAMPTZ NOT NULL,
  "executedAt" TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  "retryCount" INTEGER DEFAULT 0,
  "maxRetries" INTEGER DEFAULT 3,
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_contact ON scheduled_actions("contactId");
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_due ON scheduled_actions("scheduledFor")
  WHERE status = 'pending' AND "executedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_status ON scheduled_actions(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_actions_workflow ON scheduled_actions("workflowExecutionId");

COMMENT ON TABLE scheduled_actions IS 'Delayed workflow actions - replaces HubSpot delays';
COMMENT ON COLUMN scheduled_actions."actionData" IS 'JSON containing action-specific data (email template, property values, etc)';

-- ============================================================
-- JOB QUEUE
-- ============================================================

-- General-purpose job queue for background processing
CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY DEFAULT ('job_' || gen_random_uuid()::text),
  "jobType" TEXT NOT NULL, -- wordpress_sync, email_send, data_migration, webhook_retry, etc
  "jobData" JSONB NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  "maxRetries" INTEGER DEFAULT 3,
  "retryCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  "processedAt" TIMESTAMPTZ,
  "scheduledFor" TIMESTAMPTZ DEFAULT NOW(),
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  error TEXT,
  "processingTime" INTEGER, -- milliseconds
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue("jobType");
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue("scheduledFor")
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority, "scheduledFor")
  WHERE status = 'pending';

COMMENT ON TABLE job_queue IS 'General-purpose background job queue for async processing';
COMMENT ON COLUMN job_queue.priority IS '1 = highest priority, 10 = lowest priority';

-- ============================================================
-- EMAIL TRACKING
-- ============================================================

-- Track all outbound emails (replaces HubSpot email tracking)
CREATE TABLE IF NOT EXISTS email_tracking (
  id TEXT PRIMARY KEY DEFAULT ('email_' || gen_random_uuid()::text),
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "workflowExecutionId" TEXT REFERENCES workflow_executions(id) ON DELETE SET NULL,
  "emailType" TEXT NOT NULL, -- marketing, transactional, workflow, one_to_one
  "subscriptionType" TEXT, -- inside_success, customer_service, success_updates, one_to_one
  "emailSubject" TEXT NOT NULL,
  "emailTemplate" TEXT,
  "emailProvider" TEXT, -- resend, sendgrid, etc
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMPTZ DEFAULT NOW(),
  "deliveredAt" TIMESTAMPTZ,
  "openedAt" TIMESTAMPTZ,
  "clickedAt" TIMESTAMPTZ,
  "bouncedAt" TIMESTAMPTZ,
  "bounceReason" TEXT,
  "unsubscribedAt" TIMESTAMPTZ,
  "openCount" INTEGER DEFAULT 0,
  "clickCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, unsubscribed
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_tracking_contact ON email_tracking("contactId");
CREATE INDEX IF NOT EXISTS idx_email_tracking_workflow ON email_tracking("workflowExecutionId");
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent ON email_tracking("sentAt");
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking("emailType");
CREATE INDEX IF NOT EXISTS idx_email_tracking_subscription ON email_tracking("subscriptionType");
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);

COMMENT ON TABLE email_tracking IS 'Tracks all outbound emails - replaces HubSpot email tracking';

-- ============================================================
-- SMS TRACKING
-- ============================================================

-- Track SMS messages (replaces HubSpot SMS tracking)
CREATE TABLE IF NOT EXISTS sms_tracking (
  id TEXT PRIMARY KEY DEFAULT ('sms_' || gen_random_uuid()::text),
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "workflowExecutionId" TEXT REFERENCES workflow_executions(id) ON DELETE SET NULL,
  direction TEXT NOT NULL, -- outbound, inbound
  "phoneNumber" TEXT NOT NULL,
  message TEXT NOT NULL,
  "smsType" TEXT, -- daily_quote, compliance, marketing, transactional
  "sinchBatchId" TEXT,
  "sentAt" TIMESTAMPTZ,
  "deliveredAt" TIMESTAMPTZ,
  "failedAt" TIMESTAMPTZ,
  "failureReason" TEXT,
  status TEXT DEFAULT 'sent', -- sent, delivered, failed
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_tracking_contact ON sms_tracking("contactId");
CREATE INDEX IF NOT EXISTS idx_sms_tracking_workflow ON sms_tracking("workflowExecutionId");
CREATE INDEX IF NOT EXISTS idx_sms_tracking_phone ON sms_tracking("phoneNumber");
CREATE INDEX IF NOT EXISTS idx_sms_tracking_sent ON sms_tracking("sentAt");
CREATE INDEX IF NOT EXISTS idx_sms_tracking_direction ON sms_tracking(direction);
CREATE INDEX IF NOT EXISTS idx_sms_tracking_status ON sms_tracking(status);

COMMENT ON TABLE sms_tracking IS 'Tracks SMS messages - replaces HubSpot SMS tracking';

-- ============================================================
-- WEBHOOK LOGS
-- ============================================================

-- Log all incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY DEFAULT ('webhook_' || gen_random_uuid()::text),
  source TEXT NOT NULL, -- woocommerce, sinch, zapier, stripe, etc
  event TEXT NOT NULL, -- order.created, sms.delivered, etc
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'received', -- received, processing, success, failed
  "processedAt" TIMESTAMPTZ,
  error TEXT,
  "responseCode" INTEGER,
  "processingTime" INTEGER, -- milliseconds
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs("createdAt");

COMMENT ON TABLE webhook_logs IS 'Logs all incoming webhooks for debugging and monitoring';

-- ============================================================
-- AUTOMATION TRIGGERS
-- ============================================================

-- Database triggers for automatic workflow enrollment

-- 1. Email bounce handler
CREATE OR REPLACE FUNCTION handle_email_bounce()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact properties
  UPDATE contacts
  SET
    "emailValidationStatus" = 'bounced',
    "emailHardBounceReason" = NEW."bounceReason",
    "marketingContactStatus" = false,
    "emailHardBounced" = true,
    "updatedAt" = NOW()
  WHERE id = NEW."contactId";

  -- Create workflow execution record
  INSERT INTO workflow_executions (
    "workflowName",
    "workflowType",
    "contactId",
    status,
    "triggerSource",
    "completedAt"
  ) VALUES (
    'Operations | Email Bounced - Yes',
    'email_automation',
    NEW."contactId",
    'completed',
    'automatic',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_bounce_trigger
AFTER UPDATE ON email_tracking
FOR EACH ROW
WHEN (NEW.status = 'bounced' AND OLD.status != 'bounced')
EXECUTE FUNCTION handle_email_bounce();

-- 2. Unsubscribe handler
CREATE OR REPLACE FUNCTION handle_unsubscribe()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact to non-marketing
  UPDATE contacts
  SET
    "marketingContactStatus" = false,
    "dateUnsubFromAllEmail" = CURRENT_DATE,
    "updatedAt" = NOW()
  WHERE id = NEW."contactId";

  -- Update email preferences to opt-out all
  UPDATE email_preferences
  SET
    unsubscribed = true,
    "unsubscribedAt" = NOW(),
    "optInInsideSuccess" = false,
    "optInCustomerService" = false,
    "optInSuccessUpdates" = false,
    "optInOneToOne" = false,
    "updatedAt" = NOW()
  WHERE "contactId" = NEW."contactId";

  -- Create workflow execution record
  INSERT INTO workflow_executions (
    "workflowName",
    "workflowType",
    "contactId",
    status,
    "triggerSource",
    "completedAt"
  ) VALUES (
    'Operations - Spam & Unsubscribes - Update to Non-Marketing Contact',
    'email_automation',
    NEW."contactId",
    'completed',
    'automatic',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_unsubscribe_trigger
AFTER UPDATE ON email_tracking
FOR EACH ROW
WHEN (NEW.status = 'unsubscribed' AND OLD.status != 'unsubscribed')
EXECUTE FUNCTION handle_unsubscribe();

-- 3. Email engagement handler (opens/clicks update marketing status)
CREATE OR REPLACE FUNCTION handle_email_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact properties
  UPDATE contacts
  SET
    "lastEngagementDate" = NEW."openedAt",
    "marketingContactStatus" = true,
    "updatedAt" = NOW()
  WHERE id = NEW."contactId"
    AND "marketingContactStatus" = false;

  -- Only create workflow record if we actually updated the contact
  IF FOUND THEN
    INSERT INTO workflow_executions (
      "workflowName",
      "workflowType",
      "contactId",
      status,
      "triggerSource",
      "completedAt"
    ) VALUES (
      'Operations | Opt-Ins / Email Opens | Update Marketing Contact',
      'email_automation',
      NEW."contactId",
      'completed',
      'automatic',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_engagement_trigger
AFTER UPDATE ON email_tracking
FOR EACH ROW
WHEN (NEW."openedAt" IS NOT NULL AND OLD."openedAt" IS NULL)
EXECUTE FUNCTION handle_email_engagement();

-- 4. Deal completion handler (for SUCCESS+ access)
CREATE OR REPLACE FUNCTION handle_deal_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_email TEXT;
  v_product_name TEXT;
BEGIN
  -- Only process completed deals
  IF NEW."dealStage" != 'completed' OR OLD."dealStage" = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get contact email and product name
  SELECT email INTO v_contact_email
  FROM contacts
  WHERE id = NEW."customerId";

  v_product_name := COALESCE(NEW."productName", '');

  -- Check if SUCCESS+ product
  IF v_product_name ILIKE '%SUCCESS+ Insider%' OR v_product_name ILIKE '%Collective%' THEN
    -- Grant SUCCESS+ access
    UPDATE contacts
    SET
      "successPlusMemberPortalStatus" = 'active',
      "successPlusMembershipStartDate" = CURRENT_DATE,
      "lifecycleStage" = 'customer',
      "dateEnteredCustomer" = NOW(),
      "updatedAt" = NOW()
    WHERE id = NEW."customerId";

    -- Schedule welcome email
    INSERT INTO scheduled_actions (
      "contactId",
      "dealId",
      "actionType",
      "actionData",
      "scheduledFor"
    ) VALUES (
      NEW."customerId",
      NEW.id,
      'send_email',
      jsonb_build_object(
        'template', 'success-plus-welcome',
        'to', v_contact_email,
        'dealId', NEW.id
      ),
      NOW() + INTERVAL '5 minutes'
    );

    -- Schedule WordPress sync job
    INSERT INTO job_queue (
      "jobType",
      "jobData",
      priority
    ) VALUES (
      'wordpress_sync',
      jsonb_build_object(
        'contactId', NEW."customerId",
        'action', 'create_or_update_user',
        'dealId', NEW.id
      ),
      1
    );

    -- Create workflow execution record
    INSERT INTO workflow_executions (
      "workflowName",
      "workflowType",
      "contactId",
      "dealId",
      "currentStep",
      status,
      "triggerSource"
    ) VALUES (
      'CORE | SUCCESS+ | Customer On-Boarding | Drive to Login',
      'subscription_management',
      NEW."customerId",
      NEW.id,
      'welcome_email_scheduled',
      'active',
      'automatic'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_completion_trigger
AFTER UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION handle_deal_completion();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to enroll contact in workflow
CREATE OR REPLACE FUNCTION enroll_in_workflow(
  p_workflow_name TEXT,
  p_workflow_type TEXT,
  p_contact_id TEXT DEFAULT NULL,
  p_deal_id TEXT DEFAULT NULL,
  p_ticket_id TEXT DEFAULT NULL,
  p_trigger_source TEXT DEFAULT 'manual',
  p_triggered_by TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_execution_id TEXT;
BEGIN
  INSERT INTO workflow_executions (
    "workflowName",
    "workflowType",
    "contactId",
    "dealId",
    "ticketId",
    "triggerSource",
    "triggeredBy"
  ) VALUES (
    p_workflow_name,
    p_workflow_type,
    p_contact_id,
    p_deal_id,
    p_ticket_id,
    p_trigger_source,
    p_triggered_by
  ) RETURNING id INTO v_execution_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule an action
CREATE OR REPLACE FUNCTION schedule_action(
  p_action_type TEXT,
  p_action_data JSONB,
  p_delay_minutes INTEGER,
  p_contact_id TEXT DEFAULT NULL,
  p_deal_id TEXT DEFAULT NULL,
  p_ticket_id TEXT DEFAULT NULL,
  p_workflow_execution_id TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_action_id TEXT;
BEGIN
  INSERT INTO scheduled_actions (
    "contactId",
    "dealId",
    "ticketId",
    "workflowExecutionId",
    "actionType",
    "actionData",
    "scheduledFor"
  ) VALUES (
    p_contact_id,
    p_deal_id,
    p_ticket_id,
    p_workflow_execution_id,
    p_action_type,
    p_action_data,
    NOW() + (p_delay_minutes || ' minutes')::INTERVAL
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add job to queue
CREATE OR REPLACE FUNCTION queue_job(
  p_job_type TEXT,
  p_job_data JSONB,
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
) RETURNS TEXT AS $$
DECLARE
  v_job_id TEXT;
BEGIN
  INSERT INTO job_queue (
    "jobType",
    "jobData",
    priority,
    "scheduledFor"
  ) VALUES (
    p_job_type,
    p_job_data,
    p_priority,
    p_scheduled_for
  ) RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON FUNCTION enroll_in_workflow IS 'Manually enroll a contact/deal/ticket in a workflow';
COMMENT ON FUNCTION schedule_action IS 'Schedule a delayed workflow action';
COMMENT ON FUNCTION queue_job IS 'Add a background job to the processing queue';
