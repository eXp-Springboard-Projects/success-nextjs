# Automatic Unsubscribe List Setup

This directory contains scripts to set up the automatic unsubscribe list for the CRM.

## What is the Unsubscribe List?

The unsubscribe list is a **system-managed, auto-updating list** that:

- **Automatically tracks** all contacts with status = `UNSUBSCRIBED`
- **Auto-adds** contacts when they unsubscribe
- **Auto-removes** contacts when they resubscribe (status changes to `ACTIVE`)
- **Cannot be edited or deleted** by users (protected system list)
- **Prevents unsubscribed contacts** from being included in email campaigns
- **Still tracks numbers** for reporting and compliance

## Setup Instructions

### Step 1: Add isSystem Column

First, run the SQL migration to add the `isSystem` column to the `contact_lists` table:

```bash
# In Supabase SQL Editor, run:
# scripts/add-system-lists-column.sql
```

Or manually run:

```sql
ALTER TABLE contact_lists
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT false;

COMMENT ON COLUMN contact_lists."isSystem" IS 'System-managed lists that cannot be deleted by users';

CREATE INDEX IF NOT EXISTS idx_contact_lists_is_system ON contact_lists("isSystem");
```

### Step 2: Create Unsubscribe List

Run the setup script to create the automatic unsubscribe list:

```bash
npx tsx scripts/setup-unsubscribe-list.ts
```

This will:
1. Check if the unsubscribe list already exists
2. Create a new DYNAMIC list with filters for `status = UNSUBSCRIBED`
3. Mark it as a system list (`isSystem = true`)
4. Report the count of currently unsubscribed contacts

## How It Works

### Technical Implementation

The unsubscribe list is created as a **DYNAMIC list** with the following filter configuration:

```json
{
  "logic": "AND",
  "conditions": [
    {
      "field": "status",
      "operator": "equals",
      "value": "UNSUBSCRIBED"
    }
  ]
}
```

### UI Protection

- **List Index Page**: System lists show a "🔒 System" badge and hide Delete/Duplicate buttons
- **List Detail Page**: System lists hide the Edit button and prevent adding/removing contacts manually
- **API Protection**: DELETE and PATCH endpoints return 403 errors for system lists

### Automatic Behavior

When a contact's status changes:

1. **Contact unsubscribes** (status → `UNSUBSCRIBED`):
   - Contact automatically appears in the unsubscribe list
   - Contact excluded from all email campaigns
   - Numbers tracked for reporting

2. **Contact resubscribes** (status → `ACTIVE`):
   - Contact automatically removed from unsubscribe list
   - Contact can receive emails again
   - Subscription status restored

## Verification

After setup, verify the list was created:

1. Navigate to **Admin → CRM → Lists**
2. Look for "🚫 Unsubscribed Contacts" list
3. Check for "🔒 System" badge
4. Verify member count matches unsubscribed contacts
5. Try to edit/delete (should be prevented)

## Compliance

This system helps maintain:

- **CAN-SPAM compliance**: Automatically honors unsubscribe requests
- **GDPR compliance**: Tracks consent withdrawal
- **Audit trail**: Numbers and history preserved
- **Resubscribe support**: Contacts can opt back in
