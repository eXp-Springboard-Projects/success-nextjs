# Prisma to Supabase Conversion Guide

## Overview
This document tracks the conversion of all API route files from Prisma to Supabase database client.

## Conversion Status

### Completed (6 files)
- [x] `pages/api/auth/me.ts`
- [x] `pages/api/auth/change-password.ts`
- [x] `pages/api/auth/forgot-password.ts`
- [x] `pages/api/auth/reset-password.ts`
- [x] `pages/api/auth/register.ts`
- [x] `pages/api/auth/trial-signup.ts`

### Excluded (Already Done)
- [x] `pages/api/auth/[...nextauth].ts` - Already converted to Supabase

### Remaining Files to Convert

#### Staff Routes (11 files)
- [ ] `pages/api/admin/staff/[id].ts`
- [ ] `pages/api/admin/staff/[id]/approve.ts`
- [ ] `pages/api/admin/staff/[id]/deactivate.ts`
- [ ] `pages/api/admin/staff/[id]/reactivate.ts`
- [ ] `pages/api/admin/staff/[id]/reset-password.ts`
- [ ] `pages/api/admin/staff/[id]/reject.ts`
- [ ] `pages/api/admin/staff/[id]/send-email.ts`
- [ ] `pages/api/admin/staff/bulk-assign.ts`
- [ ] `pages/api/admin/staff/bulk-transfer.ts`
- [ ] `pages/api/admin/staff/create.ts`
- [ ] `pages/api/admin/staff/pending.ts`

#### CRM Routes (65 files)
##### Contacts (7 files)
- [ ] `pages/api/admin/crm/contacts/index.ts`
- [ ] `pages/api/admin/crm/contacts/[id].ts`
- [ ] `pages/api/admin/crm/contacts/[id]/notes.ts`
- [ ] `pages/api/admin/crm/contacts/[id]/tags.ts`
- [ ] `pages/api/admin/crm/contacts/[id]/tags/[tagId].ts`
- [ ] `pages/api/admin/crm/contacts/export.ts`
- [ ] `pages/api/admin/crm/contacts/import.ts`

##### Campaigns (9 files)
- [ ] `pages/api/admin/crm/campaigns/index.ts`
- [ ] `pages/api/admin/crm/campaigns/[id].ts`
- [ ] `pages/api/admin/crm/campaigns/[id]/pause.ts`
- [ ] `pages/api/admin/crm/campaigns/[id]/recipients.ts`
- [ ] `pages/api/admin/crm/campaigns/[id]/report.ts`
- [ ] `pages/api/admin/crm/campaigns/[id]/schedule.ts`
- [ ] `pages/api/admin/crm/campaigns/[id]/send.ts`
- [ ] `pages/api/admin/crm/campaigns/estimate-recipients.ts`
- [ ] `pages/api/admin/crm/campaigns/send-test.ts`

##### Deals (5 files)
- [ ] `pages/api/admin/crm/deals/index.ts`
- [ ] `pages/api/admin/crm/deals/[id].ts`
- [ ] `pages/api/admin/crm/deals/[id]/activities.ts`
- [ ] `pages/api/admin/crm/deals/[id]/stage.ts`
- [ ] `pages/api/admin/crm/deals/stats.ts`

##### Forms (4 files)
- [ ] `pages/api/admin/crm/forms/index.ts`
- [ ] `pages/api/admin/crm/forms/[id]/index.ts`
- [ ] `pages/api/admin/crm/forms/[id]/submissions.ts`
- [ ] `pages/api/admin/crm/forms/[id]/duplicate.ts`

##### Lists (6 files)
- [ ] `pages/api/admin/crm/lists/index.ts`
- [ ] `pages/api/admin/crm/lists/preview.ts`
- [ ] `pages/api/admin/crm/lists/[id]/index.ts`
- [ ] `pages/api/admin/crm/lists/[id]/members.ts`
- [ ] `pages/api/admin/crm/lists/[id]/preview.ts`
- [ ] `pages/api/admin/crm/lists/[id]/members/[contactId].ts`

##### Sequences (6 files)
- [ ] `pages/api/admin/crm/sequences/index.ts`
- [ ] `pages/api/admin/crm/sequences/[id].ts`
- [ ] `pages/api/admin/crm/sequences/[id]/duplicate.ts`
- [ ] `pages/api/admin/crm/sequences/[id]/enroll.ts`
- [ ] `pages/api/admin/crm/sequences/[id]/enrollments.ts`
- [ ] `pages/api/admin/crm/sequences/[id]/unenroll.ts`

##### Templates (4 files)
- [ ] `pages/api/admin/crm/templates/index.ts`
- [ ] `pages/api/admin/crm/templates/[id].ts`
- [ ] `pages/api/admin/crm/templates/[id]/duplicate.ts`
- [ ] `pages/api/admin/crm/templates/[id]/test-send.ts`

##### Tasks (3 files)
- [ ] `pages/api/admin/crm/tasks/index.ts`
- [ ] `pages/api/admin/crm/tasks/[id].ts`
- [ ] `pages/api/admin/crm/tasks/[id]/complete.ts`

##### Tickets (3 files)
- [ ] `pages/api/admin/crm/tickets/index.ts`
- [ ] `pages/api/admin/crm/tickets/[id].ts`
- [ ] `pages/api/admin/crm/tickets/[id]/messages.ts`

##### Other CRM Routes (28 files)
- [ ] `pages/api/admin/crm/analytics/index.ts`
- [ ] `pages/api/admin/crm/automations/index.ts`
- [ ] `pages/api/admin/crm/automations/[id].ts`
- [ ] `pages/api/admin/crm/automations/[id]/activate.ts`
- [ ] `pages/api/admin/crm/automations/[id]/enrollments.ts`
- [ ] `pages/api/admin/crm/automations/[id]/pause.ts`
- [ ] `pages/api/admin/crm/dashboard-stats.ts`
- [ ] `pages/api/admin/crm/landing-pages/index.ts`
- [ ] `pages/api/admin/crm/landing-pages/[id].ts`
- [ ] `pages/api/admin/crm/landing-pages/[id]/duplicate.ts`
- [ ] `pages/api/admin/crm/lead-scoring/recalculate.ts`
- [ ] `pages/api/admin/crm/lead-scoring/rules/index.ts`
- [ ] `pages/api/admin/crm/lead-scoring/rules/[id].ts`
- [ ] `pages/api/admin/crm/lead-scoring/top-leads.ts`
- [ ] `pages/api/admin/crm/promotions/index.ts`
- [ ] `pages/api/admin/crm/promotions/[id].ts`
- [ ] `pages/api/admin/crm/reports/contacts.ts`
- [ ] `pages/api/admin/crm/reports/email.ts`
- [ ] `pages/api/admin/crm/reports/deals.ts`
- [ ] `pages/api/admin/crm/reports/tickets.ts`
- [ ] `pages/api/admin/crm/reports/[type]/export.ts`
- [ ] `pages/api/admin/crm/unsubscribes/index.ts`
- [ ] `pages/api/admin/crm/unsubscribes/[id]/resubscribe.ts`

## Conversion Patterns

### Import Replacements

**Before:**
```typescript
import { prisma } from '../../../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { SomeEnum } from '@prisma/client';
```

**After:**
```typescript
import { supabaseAdmin } from '../../../lib/supabase';
import { SomeEnum } from '@/lib/types';
```

### Initialize Supabase Client

**Add at the start of handler:**
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();
  // ... rest of code
}
```

### Query Conversions

#### findUnique
**Before:**
```typescript
const user = await prisma.users.findUnique({
  where: { id: userId }
});
```

**After:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (error || !user) {
  return res.status(404).json({ error: 'User not found' });
}
```

#### findMany
**Before:**
```typescript
const users = await prisma.users.findMany({
  where: { role: 'ADMIN' }
});
```

**After:**
```typescript
const { data: users, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'ADMIN');

if (error) {
  throw error;
}
```

#### create
**Before:**
```typescript
const user = await prisma.users.create({
  data: {
    id: nanoid(),
    email: 'test@example.com',
    name: 'Test User'
  }
});
```

**After:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .insert({
    id: nanoid(),
    email: 'test@example.com',
    name: 'Test User'
  })
  .select()
  .single();

if (error) {
  throw error;
}
```

#### update
**Before:**
```typescript
const user = await prisma.users.update({
  where: { id: userId },
  data: {
    name: 'New Name',
    updatedAt: new Date()
  }
});
```

**After:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .update({
    name: 'New Name',
    updatedAt: new Date().toISOString()
  })
  .eq('id', userId)
  .select()
  .single();

if (error) {
  throw error;
}
```

#### delete
**Before:**
```typescript
await prisma.users.delete({
  where: { id: userId }
});
```

**After:**
```typescript
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);

if (error) {
  throw error;
}
```

#### count
**Before:**
```typescript
const count = await prisma.users.count({
  where: { role: 'ADMIN' }
});
```

**After:**
```typescript
const { count, error } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('role', 'ADMIN');

if (error) {
  throw error;
}
```

### Error Handling

**Prisma Error Codes → PostgreSQL/Supabase Codes:**
- `P2002` (Unique constraint) → `23505`
- `P2025` (Record not found) → Check for `error` or `!data`

### Date Handling

Supabase requires ISO string format for dates:
```typescript
// Before
updatedAt: new Date()

// After
updatedAt: new Date().toISOString()
```

### Remove Prisma-specific calls

- Remove all `await prisma.$disconnect()` calls
- Transactions need manual conversion (use Supabase RPC or application-level transactions)
- Raw SQL (`$queryRaw`, `$executeRaw`) needs manual conversion

## Files Requiring Special Attention

### Complex Queries
Files with nested `include`, `select` with relations, or complex filtering need careful manual conversion.

### Transactions
Files using `prisma.$transaction` need to be converted to either:
1. Supabase stored procedures (RPC)
2. Application-level transaction handling
3. Multiple sequential queries with rollback logic

### Raw SQL
Files with `$queryRaw` or `$executeRaw` need custom SQL queries for Supabase.

## Testing Checklist

After conversion:
- [ ] All imports resolve correctly
- [ ] No Prisma references remain
- [ ] All queries return data in expected format
- [ ] Error handling catches Supabase errors
- [ ] Dates are properly formatted as ISO strings
- [ ] Unique constraints work properly
- [ ] Foreign key relationships maintained

## Progress Summary

- **Total Files**: 82
- **Completed**: 6 (7.3%)
- **Remaining**: 76 (92.7%)

Last updated: 2025-12-23
