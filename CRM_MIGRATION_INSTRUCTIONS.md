# CRM Database Migration Instructions

## Overview
The CRM system requires database tables to be created in Supabase. The migration file has been created at:
`supabase/migrations/002_crm_tables.sql`

## How to Run the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. Go to the Supabase SQL Editor:
   https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql/new

2. Open the migration file:
   `supabase/migrations/002_crm_tables.sql`

3. Copy the entire contents of the file

4. Paste into the SQL Editor

5. Click "Run" to execute the migration

### Option 2: Command Line (if psql is installed)

```bash
psql "postgresql://postgres.aczlassjkbtwenzsohwm:YOUR_PASSWORD@db.prisma.io:5432/postgres?sslmode=require" -f supabase/migrations/002_crm_tables.sql
```

## What This Migration Creates

### Core CRM Tables:
- **contacts** - Customer/lead contact information
- **contact_lists** - Mailing lists and segments
- **contact_tags** - Tags for organizing contacts
- **contact_activities** - Activity tracking (emails, form submissions, etc.)

### Email Marketing:
- **email_campaigns** - Email campaign management
- **email_campaign_recipients** - Campaign delivery tracking
- **email_templates** - Reusable email templates
- **email_sequences** - Automated email sequences
- **sequence_emails** - Individual emails in sequences

### Sales Pipeline:
- **deals** - Sales opportunities and pipeline
- **tasks** - To-do items and follow-ups

### Customer Support:
- **tickets** - Support ticket system
- **ticket_comments** - Ticket conversation history

### Forms & Landing Pages:
- **forms** - Custom web forms
- **form_submissions** - Form submission data
- **landing_pages** - Marketing landing pages

### Automations:
- **automations** - Marketing automation workflows
- **automation_enrollments** - Contacts enrolled in automations

### Other:
- **notes** - Notes on contacts, deals, tickets
- **unsubscribes** - Unsubscribe tracking
- **lead_scoring_rules** - Lead scoring configuration
- **webhooks** - Webhook integrations
- **webhook_deliveries** - Webhook delivery logs

## Sample Data

The migration includes some sample data:
- 4 default contact tags (Customer, Prospect, Partner, VIP)
- 1 default contact list (Newsletter Subscribers)

## Verification

After running the migration, you can verify it worked by checking:

1. Go to Supabase Table Editor:
   https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/editor

2. You should see all the new CRM tables listed

3. Try accessing the CRM in the admin dashboard:
   http://localhost:3000/admin/crm

## Troubleshooting

### If you see "already exists" errors:
This is normal - it means those tables/types were created in a previous attempt. The migration is designed to be idempotent (safe to run multiple times).

### If the CRM pages show errors:
1. Check browser console for specific error messages
2. Verify all tables were created in Supabase
3. Check that the API endpoints can connect to the database
4. Look for missing tables or columns

## Next Steps

Once the migration is complete:
1. Test the CRM dashboard at `/admin/crm`
2. Try creating a contact
3. Try creating an email campaign
4. Test the forms and landing pages
5. Verify tickets and deals work correctly
