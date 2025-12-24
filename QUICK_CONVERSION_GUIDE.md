# Quick Prisma to Supabase Conversion Guide

## TL;DR

**Found:** 175+ files with Prisma imports
**Converted:** 2 files (examples completed)
**Remaining:** 173+ files
**Tools:** Automated script + documentation created

## Quick Start

1. **See examples:** Check these 2 completed conversions
   - `pages/api/webhooks/stripe.js`
   - `pages/lp/[slug].tsx`

2. **Run automation:** (handles imports)
   ```bash
   npx ts-node scripts/convert-prisma-to-supabase.ts
   ```

3. **Manual fixes:** Convert query patterns (see below)

4. **Test:** Verify endpoints work

## Common Conversions Cheat Sheet

### Imports
```typescript
// BEFORE
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// AFTER
import { supabaseAdmin } from '../../lib/supabase';
const supabase = supabaseAdmin();
```

### Find One
```typescript
// BEFORE
const user = await prisma.users.findFirst({
  where: { email: email }
});

// AFTER
const { data: users } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .limit(1);
const user = users?.[0];
```

### Find Many
```typescript
// BEFORE
const posts = await prisma.posts.findMany({
  where: { status: 'PUBLISHED' },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// AFTER
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'PUBLISHED')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Create
```typescript
// BEFORE
const user = await prisma.users.create({
  data: { name: 'John', email: 'john@example.com' }
});

// AFTER
const { data: user } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .select()
  .single();
```

### Update
```typescript
// BEFORE
await prisma.users.update({
  where: { id: userId },
  data: { name: 'Jane' }
});

// AFTER
await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', userId);
```

### Delete
```typescript
// BEFORE
await prisma.posts.delete({
  where: { id: postId }
});

// AFTER
await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

### Upsert
```typescript
// BEFORE
await prisma.subscriptions.upsert({
  where: { id: subId },
  create: { ...createData },
  update: { ...updateData }
});

// AFTER
const { data: existing } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('id', subId)
  .single();

if (!existing) {
  await supabase.from('subscriptions').insert(createData);
} else {
  await supabase.from('subscriptions').update(updateData).eq('id', subId);
}
```

### Count
```typescript
// BEFORE
const count = await prisma.posts.count();

// AFTER
const { count } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true });
```

### OR Conditions
```typescript
// BEFORE
const member = await prisma.members.findFirst({
  where: {
    OR: [
      { stripeCustomerId: id },
      { email: email }
    ]
  }
});

// AFTER
const { data: members } = await supabase
  .from('members')
  .select('*')
  .or(`stripe_customer_id.eq.${id},email.eq.${email}`)
  .limit(1);
const member = members?.[0];
```

### Increment
```typescript
// BEFORE
await prisma.members.update({
  where: { id: memberId },
  data: { totalSpent: { increment: amount } }
});

// AFTER
const { data: member } = await supabase
  .from('members')
  .select('total_spent')
  .eq('id', memberId)
  .single();

await supabase
  .from('members')
  .update({ total_spent: (member.total_spent || 0) + amount })
  .eq('id', memberId);
```

## Field Name Changes

**Rule:** camelCase → snake_case

Common examples:
- `firstName` → `first_name`
- `lastName` → `last_name`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `stripeCustomerId` → `stripe_customer_id`
- `memberId` → `member_id`

## Files to Convert (Categories)

- [ ] Stripe (5 files) - HIGH PRIORITY
- [ ] User/Account (6 files) - HIGH PRIORITY
- [ ] Dashboard (10 files) - MEDIUM
- [ ] CRM (70+ files) - MEDIUM
- [ ] Admin (30+ files) - MEDIUM
- [ ] Misc (20+ files) - LOW
- [ ] Scripts (40+ files) - LOW

## Documents Created

1. **CONVERSION_STATUS_REPORT.md** - Detailed status report
2. **PRISMA_TO_SUPABASE_REMAINING_FILES.md** - Complete file list + patterns
3. **scripts/convert-prisma-to-supabase.ts** - Automated conversion tool
4. **QUICK_CONVERSION_GUIDE.md** - This file

## Next Steps

1. Review completed examples (stripe webhook, landing page)
2. Run automated script for imports
3. Start manual query conversions by priority
4. Test thoroughly
5. Deploy incrementally

## Important Notes

⚠️ **Always test after conversion**
⚠️ **Field names are snake_case in Supabase**
⚠️ **Upserts need manual conversion**
⚠️ **Increments need fetch-then-update**
⚠️ **Nested includes require joins**

## Get Help

- See completed examples in `pages/api/webhooks/stripe.js`
- Full patterns in `PRISMA_TO_SUPABASE_REMAINING_FILES.md`
- Run automated script: `npx ts-node scripts/convert-prisma-to-supabase.ts`

---

**Created:** December 23, 2025
