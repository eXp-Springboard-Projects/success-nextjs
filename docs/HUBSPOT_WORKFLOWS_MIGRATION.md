# HubSpot Workflows Migration Plan

This document outlines the migration strategy for 217 HubSpot workflows to the SUCCESS CRM.

## Workflow Analysis Summary

**Total Workflows:** 217
**Active Workflows:** 217
**Total Enrollments:** ~2.8 million contacts

### Breakdown by Category

| Category | Count | Priority |
|----------|-------|----------|
| **Operations & Automation** | 45 | 🔴 Critical |
| **SUCCESS+ Customer Management** | 38 | 🔴 Critical |
| **Email Marketing & Nurture** | 52 | 🟡 High |
| **Customer Journey (CJ)** | 18 | 🟡 High |
| **Sync & Distribution** | 22 | 🔴 Critical |
| **Events & Webinars** | 15 | 🟢 Medium |
| **Awards (WOI, Changemakers)** | 12 | 🟢 Medium |
| **Help Desk & Support** | 8 | 🔴 Critical |
| **Content Teasers** | 7 | 🟢 Low |

---

## Critical Workflows Requiring Immediate Migration

### 1. Operations - Database Management (🔴 CRITICAL)

#### Operations | Create or Update eXp Staff/Agent
- **Enrollments:** 21,055 total | 558 last 7 days
- **Trigger:** Zapier integration
- **Purpose:** Auto-updates all eXp agent data to avoid manual imports
- **Impact:** IMPORTANT - Automatically updates all eXp data
- **Migration:**
  - Replace with Supabase webhook + API endpoint
  - Create `/api/webhooks/exp-agent-update.ts`
  - Connect to Zapier or n8n for data import

#### Operations - Spam & Unsubscribes & Bounces - Update to Non-Marketing Contact
- **Enrollments:** 38,057 total | 295 last 7 days
- **Trigger:** Email events (unsubscribe, spam, bounce)
- **Purpose:** Keeps marketing contacts list clean
- **Migration:**
  - Database trigger on `email_preferences` table
  - Update `contacts.marketingContactStatus = false`

#### Operations | Email Bounced - Yes
- **Enrollments:** 7,737 total | 132 last 7 days
- **Trigger:** Email bounce event
- **Purpose:** Sets "Email Bounced" property to "Yes"
- **Migration:**
  - Email service webhook handler
  - Update `contacts.emailValidationStatus`

### 2. SUCCESS+ Subscription Management (🔴 CRITICAL)

#### S+ | Subscription | Maintenance | Access | eXp
- **Enrollments:** 39,745 total | 386 last 7 days
- **Purpose:** Identifies contacts with active SUCCESS+ subscription
- **Migration:**
  - Supabase RLS policy + webhook
  - Update `contacts.successPlusMemberPortalStatus`

#### S+ | Subscription | Maintenance | Revoke
- **Enrollments:** 35,987 total | 4 last 7 days
- **Trigger:** Deal cancelled or refunded
- **Purpose:** Revokes platform access
- **Migration:**
  - Webhook on deal status change
  - Remove from `success_plus_members` table
  - Update WordPress user meta

#### S+ | Subscription | CW Webhook | Activate
- **Enrollments:** 203 total | 4 last 7 days
- **Purpose:** Sends webhooks to Campaign Whisperer for activation
- **Migration:**
  - API endpoint `/api/webhooks/cw-activate.ts`
  - Triggered by completed deal with SUCCESS+ product

#### S+ | Subscription | Maintenance | Password
- **Enrollments:** 3,621 total | 5 last 7 days
- **Purpose:** Updates when password is set
- **Migration:**
  - WordPress user creation webhook
  - Update `contacts` table

### 3. Sync & Distribution (🔴 CRITICAL)

#### Alexis | Sync | Create User
- **Enrollments:** 77,297 total | 432 last 7 days
- **Purpose:** Creates WordPress user when manually triggered
- **Migration:**
  - API endpoint `/api/sync/create-user.ts`
  - Direct WordPress REST API integration

#### Alexis | Sync | Update User & Metadata
- **Enrollments:** 192,208 total | 127 last 7 days
- **Purpose:** Updates WordPress user data and metadata
- **Migration:**
  - API endpoint `/api/sync/update-user.ts`
  - Batch processing for distribution workflows

#### Sync | Distribution | [Multiple Variants]
- **22 workflows** with different batch sizes (2%-50%)
- **Purpose:** Rate-limited user sync to WordPress
- **Migration:**
  - Background job queue (BullMQ or pg-boss)
  - Rate limiting per batch size
  - Progress tracking

### 4. Email Subscription Management (🔴 CRITICAL)

#### Operations - Merge newsletter subscribers into Inside SUCCESS subscriptions
- **Enrollments:** 234,931 total | 3 last 7 days
- **Purpose:** Migrates to new newsletter structure
- **Migration:**
  - Already handled by `update-email-preferences-schema.sql`
  - Run data migration script

#### Core | Condense Inside SUCCESS Subscriptions
- **Enrollments:** 226,763 total | 33 last 7 days
- **Purpose:** Updates email communication subscriptions
- **Migration:**
  - One-time data migration
  - Update `email_preferences` table

### 5. Help Desk & Customer Support (🔴 CRITICAL)

#### CX Holiday Autoresponder
- **Enrollments:** 5,570 total | 172 last 7 days
- **Trigger:** New non-chat ticket created
- **Purpose:** Sends confirmation emails (holiday vs standard)
- **Migration:**
  - Webhook on ticket creation
  - Email template with conditional logic

#### Support Pipeline: Automatically change ticket status when a customer replies
- **Enrollments:** 8 total | 5 last 7 days
- **Trigger:** Customer email reply
- **Purpose:** Updates ticket status to "Waiting on CS Agent"
- **Migration:**
  - Email parsing webhook
  - Update `tickets.status`

#### Waiting on Customer email reminder of unresolved ticket
- **Enrollments:** 28 total | 0 last 7 days
- **Trigger:** Ticket status = "Waiting on Customer" for 48 hours
- **Purpose:** Sends reminder email
- **Migration:**
  - Scheduled job (cron)
  - Check tickets updated 48 hours ago

---

## High Priority Workflows

### 6. Customer Journey (CJ) Workflows

#### Operations | Customer Journey | Brain V1
- **Enrollments:** 122,408 total | 295 last 7 days
- **Trigger:** Filter criteria
- **Purpose:** Main routing workflow - decides where to send contacts next
- **Migration:**
  - Complex workflow automation
  - Requires n8n or Make.com
  - Multiple decision branches

#### Operations | Customer Journey | Teaser Decider
- **Enrollments:** 55,730 total | 137 last 7 days
- **Purpose:** Sends content teasers based on user preferences
- **Migration:**
  - Workflow automation with property-based routing

#### CORE | Operations | eBook (CJ) | Decider
- **Enrollments:** 54,543 total | 134 last 7 days
- **Purpose:** Routes to correct Drive to Educate eBook workflow
- **Migration:**
  - Workflow automation with product routing

### 7. Email Marketing & Lead Nurture

#### Coaching | Dec 17 Web | Drive to Register
- **Enrollments:** 72,861 total | 72,832 last 7 days
- **Trigger:** Contacts on specific lists
- **Purpose:** Webinar registration drive
- **Migration:**
  - Scheduled email sequence
  - List-based enrollment

#### Operations - Database Re-engagement Campaign Emails
- **Enrollments:** 78,699 total | 1,498 last 7 days
- **Purpose:** Re-engagement campaign
- **Migration:**
  - Email sequence automation
  - Filter for inactive contacts

#### Media - Inside - Nurture - Unsubscribed - Remove from List
- **Enrollments:** 97,477 total | 262 last 7 days
- **Trigger:** Unsubscribe from Inside emails
- **Purpose:** Removes from opt-in list
- **Migration:**
  - Webhook on unsubscribe event
  - Update `email_preferences` table

### 8. SMS Workflows

#### CORE | SMS | Daily Quotes | Main Workflow (SINCH)
- **Enrollments:** 5,128 total | 59 last 7 days
- **Trigger:** Filter criteria
- **Purpose:** Powers SMS daily quote initiative
- **Migration:**
  - Already documented in `HUBSPOT_INTEGRATIONS_MIGRATION.md`
  - Sinch API integration
  - Scheduled daily job

#### Operations | SMS | Compliance Message
- **Enrollments:** 15,080 total | 62 last 7 days
- **Trigger:** SMS opt-in
- **Purpose:** Sends SMS compliance message
- **Migration:**
  - Webhook on SMS opt-in
  - Sinch API send

---

## Migration Strategy

### Phase 1: Critical Infrastructure (Week 1-2)

**Priority:** 🔴 Critical operations that affect day-to-day business

1. **Email Subscription Management**
   - Operations - Spam & Unsubscribes → Non-Marketing Contact
   - Operations | Email Bounced - Yes
   - Already have schema: `update-email-preferences-schema.sql`

2. **Help Desk Automation**
   - CX Holiday Autoresponder
   - Support Pipeline status changes
   - Waiting on Customer reminders
   - Already have schema: `enhance-helpdesk-schema.sql`

3. **SUCCESS+ Access Control**
   - S+ Subscription Maintenance workflows (Access, Revoke, Password)
   - Create API endpoints for WordPress sync
   - Database webhooks for deal status changes

4. **Sync Infrastructure**
   - Create user sync API endpoints
   - Set up job queue for batch processing
   - Rate limiting implementation

### Phase 2: Marketing Automation (Week 3-4)

**Priority:** 🟡 High - Email marketing and lead nurture

1. **Newsletter Management**
   - Migrate newsletter subscription workflows
   - Unsubscribe handling
   - Newsletter opt-in confirmations

2. **Lead Magnets & eBook Delivery**
   - eBook delivery workflows (6 different topics)
   - Content teaser workflows (7 workflows)
   - Drive to educate sequences

3. **SMS Marketing**
   - Daily quotes workflow (Sinch integration)
   - SMS compliance messages
   - SMS opt-out maintenance

### Phase 3: Customer Journey (Week 5-6)

**Priority:** 🟡 High - Complex multi-step workflows

1. **Customer Journey Brain**
   - Evaluate n8n vs Make.com vs custom automation
   - Map decision tree logic
   - Implement routing workflows

2. **eBook & Content Funnels**
   - 12 eBook workflows (Drive to Educate + Drive to Download)
   - Content teaser decider workflows
   - GTKYQ (Get to Know You Quiz) workflows

### Phase 4: Events & Awards (Week 7-8)

**Priority:** 🟢 Medium - Periodic campaigns

1. **Events**
   - i-LEAD event workflows
   - Glenn's Webinar Series
   - Win the Day event workflows

2. **Awards Programs**
   - Women of Influence (WOI) workflows
   - Changemakers workflows
   - Nomination and payment flows

### Phase 5: Legacy Cleanup (Week 9-10)

**Priority:** 🟢 Low - Inactive or low-volume workflows

1. **Archive inactive workflows** (marked [INACTIVE] or [DELETE])
2. **Consolidate duplicate workflows**
3. **Document discontinued campaigns**

---

## Workflow Replacement Patterns

### Pattern 1: Email Event Triggers → Database Webhooks

**HubSpot:** Email bounce/unsubscribe event triggers workflow
**SUCCESS CRM:** Database trigger + webhook

```sql
-- Example: Email bounce handler
CREATE OR REPLACE FUNCTION handle_email_bounce()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET
    "emailValidationStatus" = 'bounced',
    "emailHardBounceReason" = NEW.bounce_reason,
    "marketingContactStatus" = false
  WHERE email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_bounce_trigger
AFTER INSERT ON email_bounces
FOR EACH ROW
EXECUTE FUNCTION handle_email_bounce();
```

### Pattern 2: List-Based Enrollment → Filter Criteria Queries

**HubSpot:** Contact added to list triggers workflow
**SUCCESS CRM:** Scheduled job queries contacts matching criteria

```typescript
// Example: Daily re-engagement email
export async function sendReEngagementEmails() {
  const supabase = supabaseAdmin();

  // Get contacts who haven't engaged in 90 days
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('marketingContactStatus', true)
    .lt('lastEngagementDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .is('reEngagementSent', null);

  for (const contact of contacts || []) {
    await sendEmail({
      to: contact.email,
      template: 're-engagement',
      data: contact,
    });

    await supabase
      .from('contacts')
      .update({ reEngagementSent: new Date().toISOString() })
      .eq('id', contact.id);
  }
}
```

### Pattern 3: Manual Enrollment → API Endpoints

**HubSpot:** Staff manually enrolls contact in workflow
**SUCCESS CRM:** Staff clicks button → API endpoint triggers action

```typescript
// pages/api/admin/workflows/sync-user.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'STAFF') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { contactId } = req.body;

  // Add to queue for WordPress sync
  await addToQueue('wordpress-sync', {
    contactId,
    action: 'create_user',
    triggeredBy: session.user.id,
  });

  return res.status(200).json({ success: true });
}
```

### Pattern 4: Delayed Actions → Scheduled Jobs

**HubSpot:** Delay 2 days → Send email
**SUCCESS CRM:** Store scheduled action in database + cron job

```sql
-- Scheduled actions table
CREATE TABLE scheduled_actions (
  id TEXT PRIMARY KEY DEFAULT ('action_' || gen_random_uuid()::text),
  "contactId" TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  "actionType" TEXT NOT NULL, -- send_email, update_status, etc
  "actionData" JSONB NOT NULL,
  "scheduledFor" TIMESTAMPTZ NOT NULL,
  "executedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_actions_due ON scheduled_actions("scheduledFor") WHERE "executedAt" IS NULL;
```

```typescript
// Cron job: Process scheduled actions
export async function processScheduledActions() {
  const supabase = supabaseAdmin();

  const { data: actions } = await supabase
    .from('scheduled_actions')
    .select('*')
    .lte('scheduledFor', new Date().toISOString())
    .is('executedAt', null)
    .limit(100);

  for (const action of actions || []) {
    await executeAction(action);

    await supabase
      .from('scheduled_actions')
      .update({ executedAt: new Date().toISOString() })
      .eq('id', action.id);
  }
}
```

### Pattern 5: Deal/Product-Based Triggers → Webhook Handlers

**HubSpot:** Deal stage = "Completed" AND Product = "SUCCESS+ Insider"
**SUCCESS CRM:** Webhook on deal update + filter logic

```typescript
// pages/api/webhooks/deal-completed.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const deal = req.body;

  if (deal.dealStage !== 'completed') {
    return res.status(200).json({ message: 'Not completed' });
  }

  // Check if SUCCESS+ product
  if (deal.productName?.includes('SUCCESS+ Insider')) {
    // Grant SUCCESS+ access
    await supabase.from('contacts').update({
      successPlusMemberPortalStatus: 'active',
      successPlusMembershipStartDate: new Date().toISOString(),
    }).eq('id', deal.customerId);

    // Send welcome email
    await sendEmail({
      to: deal.customerEmail,
      template: 'success-plus-welcome',
      data: deal,
    });

    // Sync to WordPress
    await syncUserToWordPress(deal.customerId);
  }

  return res.status(200).json({ success: true });
}
```

---

## Workflow Automation Tools Comparison

### Option 1: n8n (Recommended)

**Pros:**
- Open-source, self-hosted option
- Visual workflow builder (similar to HubSpot)
- 350+ integrations
- Can call SUCCESS CRM APIs
- Active community

**Cons:**
- Requires server hosting
- Learning curve for staff

**Use Cases:**
- Customer Journey Brain
- Complex multi-branch workflows
- Integration with external services

### Option 2: Make.com (formerly Integromat)

**Pros:**
- Visual workflow builder
- 1,000+ integrations
- No hosting required (SaaS)
- Similar to Zapier but more powerful

**Cons:**
- Monthly cost ($9-$299/month)
- Less control than self-hosted

**Use Cases:**
- Quick migrations without dev work
- External service integrations

### Option 3: Custom Automation (Database Triggers + Scheduled Jobs)

**Pros:**
- Complete control
- No external dependencies
- No recurring costs
- Fast execution

**Cons:**
- Requires development time
- No visual workflow builder
- Harder for non-technical staff to edit

**Use Cases:**
- Simple workflows (email on trigger)
- Database-driven automation
- Real-time updates

### Recommendation: Hybrid Approach

1. **Database Triggers + Webhooks** for simple workflows (60% of workflows)
   - Email subscriptions
   - Contact updates
   - Deal status changes

2. **n8n** for complex workflows (30% of workflows)
   - Customer Journey Brain
   - Multi-step sequences with branching logic
   - External integrations

3. **Scheduled Jobs (cron)** for time-based workflows (10% of workflows)
   - Daily email sends
   - Reminder emails
   - Cleanup tasks

---

## Database Schema Updates Required

### Workflow Tracking Table

```sql
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY DEFAULT ('wf_' || gen_random_uuid()::text),
  "workflowName" TEXT NOT NULL,
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "dealId" TEXT REFERENCES deals(id) ON DELETE CASCADE,
  "ticketId" TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  "enrolledAt" TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "currentStep" TEXT,
  status TEXT DEFAULT 'active', -- active, completed, failed, unenrolled
  "stepHistory" JSONB DEFAULT '[]',
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_executions_contact ON workflow_executions("contactId");
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions("workflowName");
```

### Scheduled Actions Table

```sql
CREATE TABLE scheduled_actions (
  id TEXT PRIMARY KEY DEFAULT ('action_' || gen_random_uuid()::text),
  "contactId" TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  "workflowExecutionId" TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
  "actionType" TEXT NOT NULL,
  "actionData" JSONB NOT NULL,
  "scheduledFor" TIMESTAMPTZ NOT NULL,
  "executedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_actions_due ON scheduled_actions("scheduledFor") WHERE "executedAt" IS NULL;
```

### Job Queue Table

```sql
CREATE TABLE job_queue (
  id TEXT PRIMARY KEY DEFAULT ('job_' || gen_random_uuid()::text),
  "jobType" TEXT NOT NULL, -- wordpress_sync, email_send, etc
  "jobData" JSONB NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  "maxRetries" INTEGER DEFAULT 3,
  "retryCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  "processedAt" TIMESTAMPTZ,
  "scheduledFor" TIMESTAMPTZ DEFAULT NOW(),
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_scheduled ON job_queue("scheduledFor") WHERE status = 'pending';
CREATE INDEX idx_job_queue_priority ON job_queue(priority);
```

---

## Migration Checklist

### Pre-Migration
- [x] Export all HubSpot workflows (COMPLETED)
- [ ] Document workflow dependencies
- [ ] Identify critical vs nice-to-have workflows
- [ ] Map HubSpot properties to SUCCESS CRM fields
- [ ] Create workflow execution tracking schema

### Phase 1: Critical Infrastructure
- [ ] Email subscription management (Operations - Spam & Unsubscribes)
- [ ] Email bounce handling (Operations | Email Bounced)
- [ ] Help desk automation (CX Holiday Autoresponder, status changes)
- [ ] SUCCESS+ access control (S+ Subscription Maintenance)
- [ ] WordPress sync endpoints (Alexis | Sync | Create/Update User)
- [ ] Job queue implementation

### Phase 2: Marketing Automation
- [ ] Newsletter management workflows
- [ ] eBook delivery workflows
- [ ] Content teaser workflows
- [ ] SMS workflows (Daily Quotes, Compliance)

### Phase 3: Customer Journey
- [ ] Set up n8n or Make.com
- [ ] Migrate Customer Journey Brain
- [ ] Migrate eBook decider workflows
- [ ] Migrate teaser decider workflows

### Phase 4: Events & Awards
- [ ] i-LEAD event workflows
- [ ] Glenn's Webinar Series
- [ ] Women of Influence workflows
- [ ] Changemakers workflows

### Phase 5: Testing & Validation
- [ ] Test each workflow with sample data
- [ ] Verify email deliverability
- [ ] Check WordPress sync accuracy
- [ ] Monitor error rates
- [ ] Compare enrollment numbers to HubSpot

### Post-Migration
- [ ] Monitor workflow execution logs
- [ ] Set up alerts for failed workflows
- [ ] Train staff on new workflow management
- [ ] Archive HubSpot workflows
- [ ] Document new workflow creation process

---

## Estimated Timeline

**Total Duration:** 10 weeks (2.5 months)

| Phase | Duration | Resources Required |
|-------|----------|-------------------|
| Phase 1: Critical Infrastructure | 2 weeks | 1 developer |
| Phase 2: Marketing Automation | 2 weeks | 1 developer |
| Phase 3: Customer Journey | 2 weeks | 1 developer + n8n setup |
| Phase 4: Events & Awards | 2 weeks | 1 developer |
| Phase 5: Testing & Validation | 2 weeks | 1 developer + QA |

**Total Effort:** ~400 hours of development work

---

## Cost Analysis

### Option 1: Full Custom Development
- **Development:** $0 (using Claude Code)
- **Ongoing:** $0/month (hosted on existing Vercel infrastructure)
- **Total Year 1:** $0

### Option 2: Hybrid (Custom + n8n Self-Hosted)
- **Development:** $0 (using Claude Code)
- **n8n Hosting:** $20/month (DigitalOcean droplet) or $0 (Docker on existing server)
- **Total Year 1:** $0-$240

### Option 3: Hybrid (Custom + Make.com)
- **Development:** $0 (using Claude Code)
- **Make.com:** $99/month (Core plan, 10K operations)
- **Total Year 1:** $1,188

**Recommendation:** Option 1 (Full Custom Development) - Zero cost, complete control, hosted on existing infrastructure. Most workflows can be replaced with database triggers, webhooks, and scheduled jobs without needing external automation platforms.

---

## Next Steps

1. **Review this migration plan** - Approve approach and timeline
2. **Set up workflow tracking infrastructure** - Run SQL schema migrations
3. **Start Phase 1: Critical Infrastructure** - Begin with email/help desk automation
4. **Decide on automation platform** - Choose between n8n, Make.com, or full custom
5. **Allocate resources** - Assign developer(s) and set milestones
