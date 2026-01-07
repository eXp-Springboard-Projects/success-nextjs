-- Help Desk Automation Triggers
-- Replaces HubSpot ticket workflows
-- Run this AFTER enhance-helpdesk-schema.sql and create-workflow-automation-schema.sql

-- ============================================================
-- TICKET AUTOMATION TRIGGERS
-- ============================================================

-- 1. New ticket created → Send autoresponder
CREATE OR REPLACE FUNCTION send_ticket_autoresponder()
RETURNS TRIGGER AS $$
DECLARE
  v_is_holiday BOOLEAN;
  v_email_template TEXT;
BEGIN
  -- Skip chat tickets
  IF NEW.source = 'chat' THEN
    RETURN NEW;
  END IF;

  -- Check if today is a holiday (simple check for major US holidays)
  v_is_holiday := (
    -- Thanksgiving (4th Thursday in November)
    (EXTRACT(MONTH FROM CURRENT_DATE) = 11 AND
     EXTRACT(DOW FROM CURRENT_DATE) = 4 AND
     EXTRACT(DAY FROM CURRENT_DATE) BETWEEN 22 AND 28)
    OR
    -- Christmas
    (EXTRACT(MONTH FROM CURRENT_DATE) = 12 AND EXTRACT(DAY FROM CURRENT_DATE) = 25)
    OR
    -- New Year's Day
    (EXTRACT(MONTH FROM CURRENT_DATE) = 1 AND EXTRACT(DAY FROM CURRENT_DATE) = 1)
  );

  -- Choose template based on holiday status
  v_email_template := CASE
    WHEN v_is_holiday THEN 'ticket-autoresponder-holiday'
    ELSE 'ticket-autoresponder-standard'
  END;

  -- Schedule autoresponder email (3 minute delay)
  INSERT INTO scheduled_actions (
    "ticketId",
    "actionType",
    "actionData",
    "scheduledFor"
  ) VALUES (
    NEW.id,
    'send_email',
    jsonb_build_object(
      'template', v_email_template,
      'to', NEW."customerEmail",
      'ticketId', NEW.id,
      'ticketNumber', NEW."ticketNumber"
    ),
    NOW() + INTERVAL '3 minutes'
  );

  -- Create workflow execution record
  INSERT INTO workflow_executions (
    "workflowName",
    "workflowType",
    "ticketId",
    status,
    "triggerSource",
    "currentStep"
  ) VALUES (
    'CX Holiday Autoresponder',
    'helpdesk_automation',
    NEW.id,
    'active',
    'automatic',
    'autoresponder_scheduled'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_autoresponder_trigger
AFTER INSERT ON tickets
FOR EACH ROW
WHEN (NEW.source != 'chat')
EXECUTE FUNCTION send_ticket_autoresponder();

-- 2. Customer replies to ticket → Change status to "Waiting on CS Agent"
CREATE OR REPLACE FUNCTION handle_customer_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if ticket is not already in "Waiting on CS Agent" status
  UPDATE tickets
  SET
    status = 'waiting_cs',
    "updatedAt" = NOW()
  WHERE id = NEW."ticketId"
    AND status != 'waiting_cs'
    AND pipeline = 'support';

  -- Create workflow execution record if we updated
  IF FOUND THEN
    INSERT INTO workflow_executions (
      "workflowName",
      "workflowType",
      "ticketId",
      status,
      "triggerSource",
      "completedAt"
    ) VALUES (
      'Support Pipeline: Automatically change ticket status when a customer replies',
      'helpdesk_automation',
      NEW."ticketId",
      'completed',
      'automatic',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assuming we have a ticket_messages table for tracking communications
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || gen_random_uuid()::text),
  "ticketId" TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- inbound, outbound
  "fromEmail" TEXT,
  "fromName" TEXT,
  "toEmail" TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  "isInternal" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages("ticketId");
CREATE INDEX IF NOT EXISTS idx_ticket_messages_direction ON ticket_messages(direction);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages("createdAt");

CREATE TRIGGER customer_reply_trigger
AFTER INSERT ON ticket_messages
FOR EACH ROW
WHEN (NEW.direction = 'inbound' AND NEW."isInternal" = false)
EXECUTE FUNCTION handle_customer_reply();

-- 3. Email sent to customer → Change status to "Waiting on Customer"
CREATE OR REPLACE FUNCTION handle_agent_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ticket status to "Waiting on Customer"
  UPDATE tickets
  SET
    status = 'waiting_customer',
    "updatedAt" = NOW()
  WHERE id = NEW."ticketId"
    AND pipeline = 'support';

  -- Create workflow execution record
  IF FOUND THEN
    INSERT INTO workflow_executions (
      "workflowName",
      "workflowType",
      "ticketId",
      status,
      "triggerSource",
      "completedAt"
    ) VALUES (
      'Support Pipeline: Automatically change ticket status when an email is sent',
      'helpdesk_automation',
      NEW."ticketId",
      'completed',
      'automatic',
      NOW()
    );

    -- Schedule reminder email for 48 hours if no response
    INSERT INTO scheduled_actions (
      "ticketId",
      "actionType",
      "actionData",
      "scheduledFor"
    ) VALUES (
      NEW."ticketId",
      'send_email',
      jsonb_build_object(
        'template', 'ticket-waiting-reminder',
        'ticketId', NEW."ticketId",
        'check_status', 'waiting_customer'
      ),
      NOW() + INTERVAL '48 hours'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_reply_trigger
AFTER INSERT ON ticket_messages
FOR EACH ROW
WHEN (NEW.direction = 'outbound' AND NEW."isInternal" = false)
EXECUTE FUNCTION handle_agent_reply();

-- 4. Ticket waiting on customer for 48 hours → Send reminder
-- This will be handled by the scheduled actions processor
-- The action was already scheduled in handle_agent_reply()

-- Function to process the reminder (called by cron job)
CREATE OR REPLACE FUNCTION process_ticket_reminders()
RETURNS TABLE (
  action_id TEXT,
  ticket_id TEXT,
  result TEXT
) AS $$
DECLARE
  v_action RECORD;
  v_ticket RECORD;
  v_customer_email TEXT;
BEGIN
  -- Find all due reminder actions
  FOR v_action IN
    SELECT *
    FROM scheduled_actions
    WHERE "actionType" = 'send_email'
      AND "actionData"->>'template' = 'ticket-waiting-reminder'
      AND status = 'pending'
      AND "scheduledFor" <= NOW()
  LOOP
    -- Get ticket details
    SELECT t.*, c.email AS "customerEmail"
    INTO v_ticket
    FROM tickets t
    LEFT JOIN contacts c ON t."contactId" = c.id
    WHERE t.id = v_action."ticketId";

    -- Only send if ticket is still in "waiting_customer" status
    IF v_ticket.status = 'waiting_customer' THEN
      -- Schedule the email
      INSERT INTO email_tracking (
        "contactId",
        "emailType",
        "emailSubject",
        "emailTemplate",
        status
      ) VALUES (
        v_ticket."contactId",
        'transactional',
        'Reminder: Your support ticket is waiting for a response',
        'ticket-waiting-reminder',
        'sent'
      );

      -- Mark action as completed
      UPDATE scheduled_actions
      SET
        status = 'completed',
        "executedAt" = NOW()
      WHERE id = v_action.id;

      action_id := v_action.id;
      ticket_id := v_action."ticketId";
      result := 'reminder_sent';
      RETURN NEXT;
    ELSE
      -- Ticket status changed, cancel the reminder
      UPDATE scheduled_actions
      SET
        status = 'cancelled',
        "executedAt" = NOW()
      WHERE id = v_action.id;

      action_id := v_action.id;
      ticket_id := v_action."ticketId";
      result := 'cancelled_status_changed';
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TICKET ASSIGNMENT AUTOMATION
-- ============================================================

-- Auto-assign tickets to available agents (round-robin)
CREATE OR REPLACE FUNCTION auto_assign_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_next_agent_id TEXT;
  v_agent_email TEXT;
BEGIN
  -- Skip if already assigned
  IF NEW."ownerId" IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find next available agent (round-robin based on ticket count)
  SELECT u.id, u.email
  INTO v_next_agent_id, v_agent_email
  FROM users u
  LEFT JOIN (
    SELECT "ownerId", COUNT(*) as ticket_count
    FROM tickets
    WHERE status NOT IN ('closed', 'resolved')
      AND "ownerId" IS NOT NULL
    GROUP BY "ownerId"
  ) t ON u.id = t."ownerId"
  WHERE u.role IN ('STAFF', 'ADMIN')
    AND u."isActive" = true
  ORDER BY COALESCE(t.ticket_count, 0) ASC, u."createdAt" ASC
  LIMIT 1;

  -- Assign the ticket
  IF v_next_agent_id IS NOT NULL THEN
    UPDATE tickets
    SET
      "ownerId" = v_next_agent_id,
      "ownerAssignedDate" = NOW(),
      "updatedAt" = NOW()
    WHERE id = NEW.id;

    -- Notify the assigned agent
    INSERT INTO scheduled_actions (
      "ticketId",
      "actionType",
      "actionData",
      "scheduledFor"
    ) VALUES (
      NEW.id,
      'send_email',
      jsonb_build_object(
        'template', 'ticket-assigned-to-agent',
        'to', v_agent_email,
        'ticketId', NEW.id,
        'ticketNumber', NEW."ticketNumber"
      ),
      NOW() + INTERVAL '1 minute'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only auto-assign new tickets if your workflow requires it
-- CREATE TRIGGER ticket_auto_assign_trigger
-- AFTER INSERT ON tickets
-- FOR EACH ROW
-- EXECUTE FUNCTION auto_assign_ticket();

-- ============================================================
-- TICKET SLA TRACKING
-- ============================================================

-- Track SLA breaches
CREATE OR REPLACE FUNCTION check_ticket_sla()
RETURNS TABLE (
  ticket_id TEXT,
  ticket_number TEXT,
  status TEXT,
  created_hours_ago NUMERIC,
  sla_target_hours INTEGER,
  breach_severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t."ticketNumber",
    t.status,
    EXTRACT(EPOCH FROM (NOW() - t."createdAt")) / 3600 AS created_hours_ago,
    CASE t.priority
      WHEN 'urgent' THEN 4
      WHEN 'high' THEN 24
      WHEN 'medium' THEN 48
      ELSE 72
    END AS sla_target_hours,
    CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - t."createdAt")) / 3600 >
        CASE t.priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 24
          WHEN 'medium' THEN 48
          ELSE 72
        END * 1.5 THEN 'critical'
      WHEN EXTRACT(EPOCH FROM (NOW() - t."createdAt")) / 3600 >
        CASE t.priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 24
          WHEN 'medium' THEN 48
          ELSE 72
        END THEN 'warning'
      ELSE 'ok'
    END AS breach_severity
  FROM tickets t
  WHERE t.status NOT IN ('closed', 'resolved')
    AND t."createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

COMMENT ON FUNCTION send_ticket_autoresponder IS 'Sends autoresponder email when new ticket is created';
COMMENT ON FUNCTION handle_customer_reply IS 'Changes ticket status to "Waiting on CS Agent" when customer replies';
COMMENT ON FUNCTION handle_agent_reply IS 'Changes ticket status to "Waiting on Customer" when agent replies';
COMMENT ON FUNCTION process_ticket_reminders IS 'Processes scheduled 48-hour reminders for tickets waiting on customer';
COMMENT ON FUNCTION auto_assign_ticket IS 'Auto-assigns tickets to agents using round-robin';
COMMENT ON FUNCTION check_ticket_sla IS 'Checks SLA status for all open tickets';
