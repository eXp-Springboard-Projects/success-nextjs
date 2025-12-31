-- CRM Database Schema
-- This migration creates all tables needed for the SUCCESS CRM system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONTACTS
-- ============================================================================

-- Contact email status enum
CREATE TYPE email_status AS ENUM ('subscribed', 'unsubscribed', 'bounced', 'complained');

-- Contact source enum
CREATE TYPE contact_source AS ENUM ('manual', 'import', 'form', 'api', 'landing_page', 'webinar', 'event');

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  source contact_source DEFAULT 'manual',
  email_status email_status DEFAULT 'subscribed',
  lead_score INTEGER DEFAULT 0,
  custom_fields JSONB DEFAULT '{}',
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  last_email_opened_at TIMESTAMPTZ,
  last_email_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_email_status ON contacts(email_status);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_lead_score ON contacts(lead_score DESC);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- ============================================================================
-- CONTACT LISTS
-- ============================================================================

-- Contact lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_dynamic BOOLEAN DEFAULT FALSE,
  filter_conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_lists_name ON contact_lists(name);

-- Contact list members table
CREATE TABLE IF NOT EXISTS contact_list_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  list_id TEXT NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, list_id)
);

CREATE INDEX idx_contact_list_members_contact ON contact_list_members(contact_id);
CREATE INDEX idx_contact_list_members_list ON contact_list_members(list_id);

-- ============================================================================
-- CONTACT TAGS
-- ============================================================================

-- Contact tags table
CREATE TABLE IF NOT EXISTS contact_tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_tags_name ON contact_tags(name);

-- Contact tag assignments table
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_contact_tag_assignments_contact ON contact_tag_assignments(contact_id);
CREATE INDEX idx_contact_tag_assignments_tag ON contact_tag_assignments(tag_id);

-- ============================================================================
-- CONTACT ACTIVITIES
-- ============================================================================

-- Contact activity type enum
CREATE TYPE contact_activity_type AS ENUM (
  'contact_created', 'contact_updated', 'email_sent', 'email_opened', 'email_clicked',
  'email_bounced', 'form_submitted', 'page_visited', 'file_downloaded',
  'deal_created', 'deal_updated', 'note_added', 'task_created', 'call_logged'
);

-- Contact activities table
CREATE TABLE IF NOT EXISTS contact_activities (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type contact_activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_activities_contact ON contact_activities(contact_id);
CREATE INDEX idx_contact_activities_type ON contact_activities(type);
CREATE INDEX idx_contact_activities_created_at ON contact_activities(created_at DESC);

-- ============================================================================
-- EMAIL CAMPAIGNS
-- ============================================================================

-- Campaign status enum
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  from_name TEXT DEFAULT 'SUCCESS',
  from_email TEXT DEFAULT 'noreply@success.com',
  reply_to TEXT,
  html_content TEXT,
  text_content TEXT,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

-- ============================================================================
-- EMAIL CAMPAIGN RECIPIENTS
-- ============================================================================

-- Campaign recipient status enum
CREATE TYPE recipient_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed', 'complained');

-- Email campaign recipients table
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  campaign_id TEXT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status recipient_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_contact ON email_campaign_recipients(contact_id);
CREATE INDEX idx_email_campaign_recipients_status ON email_campaign_recipients(status);

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

-- Email template type enum
CREATE TYPE template_type AS ENUM ('marketing', 'transactional', 'newsletter', 'automated');

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type template_type DEFAULT 'marketing',
  subject TEXT,
  preview_text TEXT,
  html_content TEXT,
  text_content TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX idx_email_templates_created_at ON email_templates(created_at DESC);

-- ============================================================================
-- DEALS (SALES PIPELINE)
-- ============================================================================

-- Deal stage enum
CREATE TYPE deal_stage AS ENUM (
  'lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
);

-- Deal priority enum
CREATE TYPE deal_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  stage deal_stage DEFAULT 'lead',
  stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
  value DECIMAL(10, 2) DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  priority deal_priority DEFAULT 'medium',
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  lost_reason TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  assigned_to TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_priority ON deals(priority);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- ============================================================================
-- TICKETS (CUSTOMER SUPPORT)
-- ============================================================================

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');

-- Ticket priority enum
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  category TEXT,
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolution_time_hours DECIMAL(10, 2),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_contact ON tickets(contact_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- ============================================================================
-- TICKET COMMENTS
-- ============================================================================

-- Ticket comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

-- ============================================================================
-- TASKS
-- ============================================================================

-- Task status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_ticket ON tasks(ticket_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- ============================================================================
-- FORMS
-- ============================================================================

-- Form status enum
CREATE TYPE form_status AS ENUM ('draft', 'published', 'archived');

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status form_status DEFAULT 'draft',
  fields JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  submission_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_created_at ON forms(created_at DESC);

-- ============================================================================
-- FORM SUBMISSIONS
-- ============================================================================

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_contact ON form_submissions(contact_id);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);

-- ============================================================================
-- AUTOMATIONS
-- ============================================================================

-- Automation status enum
CREATE TYPE automation_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status automation_status DEFAULT 'draft',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  enrollment_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_trigger_type ON automations(trigger_type);
CREATE INDEX idx_automations_created_at ON automations(created_at DESC);

-- ============================================================================
-- AUTOMATION ENROLLMENTS
-- ============================================================================

-- Automation enrollment status enum
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'failed', 'exited');

-- Automation enrollments table
CREATE TABLE IF NOT EXISTS automation_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  UNIQUE(automation_id, contact_id)
);

CREATE INDEX idx_automation_enrollments_automation ON automation_enrollments(automation_id);
CREATE INDEX idx_automation_enrollments_contact ON automation_enrollments(contact_id);
CREATE INDEX idx_automation_enrollments_status ON automation_enrollments(status);

-- ============================================================================
-- LANDING PAGES
-- ============================================================================

-- Landing page status enum
CREATE TYPE landing_page_status AS ENUM ('draft', 'published', 'archived');

-- Landing pages table
CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  status landing_page_status DEFAULT 'draft',
  html_content TEXT,
  css_content TEXT,
  form_id TEXT REFERENCES forms(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);
CREATE INDEX idx_landing_pages_created_at ON landing_pages(created_at DESC);

-- ============================================================================
-- UNSUBSCRIBES
-- ============================================================================

-- Unsubscribe reasons table
CREATE TABLE IF NOT EXISTS unsubscribes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  campaign_id TEXT REFERENCES email_campaigns(id) ON DELETE SET NULL,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unsubscribes_contact ON unsubscribes(contact_id);
CREATE INDEX idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX idx_unsubscribes_campaign ON unsubscribes(campaign_id);
CREATE INDEX idx_unsubscribes_unsubscribed_at ON unsubscribes(unsubscribed_at DESC);

-- ============================================================================
-- EMAIL SEQUENCES
-- ============================================================================

-- Email sequence status enum
CREATE TYPE sequence_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- Email sequences table
CREATE TABLE IF NOT EXISTS email_sequences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status sequence_status DEFAULT 'draft',
  enrollment_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_sequences_status ON email_sequences(status);
CREATE INDEX idx_email_sequences_created_at ON email_sequences(created_at DESC);

-- ============================================================================
-- SEQUENCE EMAILS
-- ============================================================================

-- Sequence emails table
CREATE TABLE IF NOT EXISTS sequence_emails (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sequence_id TEXT NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

CREATE INDEX idx_sequence_emails_sequence ON sequence_emails(sequence_id);

-- ============================================================================
-- SEQUENCE ENROLLMENTS
-- ============================================================================

-- Sequence enrollment status enum
CREATE TYPE sequence_enrollment_status AS ENUM ('active', 'completed', 'paused', 'exited');

-- Sequence enrollments table
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sequence_id TEXT NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status sequence_enrollment_status DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_email_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  UNIQUE(sequence_id, contact_id)
);

CREATE INDEX idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_contact ON sequence_enrollments(contact_id);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(status);
CREATE INDEX idx_sequence_enrollments_next_email_at ON sequence_enrollments(next_email_at);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES deals(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);
CREATE INDEX idx_notes_ticket ON notes(ticket_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ============================================================================
-- LEAD SCORING RULES
-- ============================================================================

-- Lead scoring rules table
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  score_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_scoring_rules_trigger_type ON lead_scoring_rules(trigger_type);
CREATE INDEX idx_lead_scoring_rules_is_active ON lead_scoring_rules(is_active);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

-- Webhook event type enum
CREATE TYPE webhook_event AS ENUM (
  'contact.created', 'contact.updated', 'contact.deleted',
  'email.sent', 'email.opened', 'email.clicked', 'email.bounced',
  'form.submitted', 'deal.created', 'deal.updated', 'ticket.created'
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  url TEXT NOT NULL,
  events webhook_event[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

-- ============================================================================
-- WEBHOOK DELIVERIES
-- ============================================================================

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event webhook_event NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON contact_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample contact tags
INSERT INTO contact_tags (id, name, color) VALUES
  ('tag_customer', 'Customer', '#22c55e'),
  ('tag_prospect', 'Prospect', '#3b82f6'),
  ('tag_partner', 'Partner', '#8b5cf6'),
  ('tag_vip', 'VIP', '#f59e0b')
ON CONFLICT (name) DO NOTHING;

-- Insert sample contact list
INSERT INTO contact_lists (id, name, description) VALUES
  ('list_newsletter', 'Newsletter Subscribers', 'All contacts subscribed to our newsletter')
ON CONFLICT (id) DO NOTHING;
