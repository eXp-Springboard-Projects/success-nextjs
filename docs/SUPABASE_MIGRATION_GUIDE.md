# Supabase Migration Guide

## Overview

This guide documents the migration from Prisma-only to a **hybrid Prisma + Supabase setup**. Your PostgreSQL database is already hosted on Supabase, so this is primarily about adding Supabase client capabilities while keeping Prisma as the primary ORM.

## Current Status: ✅ COMPLETE

### What Changed

1. **Added Supabase JavaScript Client** (`@supabase/supabase-js`)
2. **Created Supabase Client Configuration** (`lib/supabase.ts`)
3. **Updated Environment Variables** with Supabase API keys
4. **Database remains unchanged** - Already on Supabase!

### What Stayed the Same

- ✅ All existing Prisma queries work exactly as before
- ✅ Database schema unchanged
- ✅ All API routes continue to use Prisma
- ✅ No code refactoring required

---

## Architecture

### Hybrid Approach (Current Implementation)

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌───────────────┐  │
│  │ Prisma ORM   │   │ Supabase SDK  │  │
│  │ (Primary)    │   │ (Optional)    │  │
│  └──────┬───────┘   └───────┬───────┘  │
│         │                   │          │
│         └─────────┬─────────┘          │
│                   │                    │
└───────────────────┼────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │  Supabase PostgreSQL │
        │  Database            │
        └─────────────────────┘
```

### Connection Details

- **Database Host**: `db.aczlassjkbtwenzsohwm.supabase.co`
- **Pooler Port**: `6543` (Connection pooling - used by Prisma)
- **Direct Port**: `5432` (Direct connection - migrations)
- **Database**: `postgres`
- **Schema**: `public`

---

## Setup Instructions

### 1. Get Supabase API Keys

Visit the Supabase Dashboard:
👉 https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api

You need two keys:
- **Anon/Public Key** (`anon` role) - Safe for client-side
- **Service Role Key** (`service_role`) - Server-side only, bypasses RLS

### 2. Update Environment Variables

#### Local Development (`.env.local`)

```bash
# Supabase - API Keys
NEXT_PUBLIC_SUPABASE_URL=https://aczlassjkbtwenzsohwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

#### Production (`.env.production` or Vercel)

Add the same variables to your production environment.

### 3. Verify Installation

Run the test script:

```bash
npx tsx scripts/test-supabase-connection.ts
```

Expected output:
```
✅ Prisma connected! Found X users in database
✅ Supabase connected! Database is accessible
✅ Both clients are reading from the same database!
```

---

## Usage Examples

### When to Use Prisma (Recommended Default)

Prisma is excellent for:
- ✅ Complex queries with joins and relations
- ✅ Type-safe queries with TypeScript
- ✅ Transactions
- ✅ Database migrations
- ✅ Existing API routes (no changes needed)

**Example:**

```typescript
import { prisma } from '@/lib/prisma';

// Type-safe, autocomplete-friendly
const user = await prisma.users.findUnique({
  where: { email: 'user@example.com' },
  include: { posts: true, subscriptions: true }
});
```

### When to Use Supabase

Supabase client adds these capabilities:
- ✅ **Real-time subscriptions** (live updates)
- ✅ **Row Level Security** (RLS) policies
- ✅ **File storage** (Supabase Storage)
- ✅ **Edge functions** (Serverless functions)
- ✅ **PostgREST API** (Auto-generated REST API)

**Example - Real-time Subscription:**

```typescript
import { supabase } from '@/lib/supabase';

// Listen to new posts in real-time
const channel = supabase
  .channel('posts-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('New post!', payload.new);
    }
  )
  .subscribe();

// Clean up when done
channel.unsubscribe();
```

**Example - Simple Query:**

```typescript
import { supabase } from '@/lib/supabase';

// Fetch users with Supabase
const { data, error } = await supabase
  .from('users')
  .select('id, email, name')
  .eq('role', 'EDITOR')
  .limit(10);

if (error) {
  console.error('Query failed:', error);
}
```

**Example - Server-side Admin Operations:**

```typescript
import { supabaseAdmin } from '@/lib/supabase';

// Bypass RLS policies (server-side only!)
const admin = supabaseAdmin();

const { data, error } = await admin
  .from('users')
  .select('*')
  .eq('email', 'admin@example.com')
  .single();
```

---

## Migration Paths

### Option A: Keep Hybrid (Recommended) ✅

**Status**: This is what we implemented!

**When to use**:
- You're happy with Prisma for standard queries
- You want real-time features for specific use cases
- Minimal disruption to existing code

**How it works**:
- Keep all existing Prisma code unchanged
- Add Supabase client for new real-time features
- Use both side-by-side as needed

### Option B: Full Migration to Supabase

**Status**: Not implemented (optional future enhancement)

**When to consider**:
- You need real-time everywhere
- You want to use Supabase Auth instead of NextAuth
- You prefer Supabase's query builder over Prisma

**Effort**: High - Would require updating ~444 files

---

## Feature Comparison

| Feature | Prisma | Supabase |
|---------|--------|----------|
| Type Safety | ✅ Excellent | ⚠️ Good (with generated types) |
| Relations/Joins | ✅ Excellent | ⚠️ Limited |
| Migrations | ✅ Built-in | ✅ SQL migrations |
| Real-time | ❌ No | ✅ Yes |
| Row Level Security | ❌ No | ✅ Yes |
| File Storage | ❌ No | ✅ Yes |
| Edge Functions | ❌ No | ✅ Yes |
| Learning Curve | ⚠️ Moderate | ⚠️ Moderate |

---

## Real-Time Features Examples

### 1. Live Dashboard Updates

```typescript
// pages/admin/dashboard.tsx
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('dashboard-stats')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        (payload) => {
          console.log('Subscription changed!', payload);
          // Refresh stats
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of component
}
```

### 2. Live Comments Section

```typescript
// components/LiveComments.tsx
import { supabase } from '@/lib/supabase';

function LiveComments({ postId }) {
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `postId=eq.${postId}`
        },
        (payload) => {
          // Add new comment to UI
          setComments(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [postId]);
}
```

### 3. Live User Activity Feed

```typescript
// pages/admin/activity.tsx
const channel = supabase
  .channel('activity-feed')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'activity_logs' },
    (payload) => {
      // Show notification
      showNotification(`New activity: ${payload.new.action}`);
    }
  )
  .subscribe();
```

---

## Database Management

### Prisma Migrations (Recommended for Schema Changes)

```bash
# Create a new migration
npx prisma migrate dev --name add_new_column

# Apply migrations to production
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

### Supabase Dashboard

Access at: https://app.supabase.com/project/aczlassjkbtwenzsohwm

Features:
- 📊 Table Editor (visual data editing)
- 📈 SQL Editor (run custom queries)
- 🔒 Row Level Security setup
- 📁 Storage management
- 📊 Real-time inspector
- 📉 Database metrics

---

## Security Considerations

### API Keys

- ✅ **Anon Key**: Safe for client-side, respects RLS
- ⚠️ **Service Role Key**: SERVER-SIDE ONLY! Bypasses all security

### Row Level Security (RLS)

RLS is currently **disabled**. To enable:

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/auth/policies

2. Create policies per table:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Example: Only admins can insert
CREATE POLICY "Admins can insert"
ON posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'SUPER_ADMIN'
  )
);
```

---

## Troubleshooting

### Connection Errors

**Problem**: `Can't reach database server`

**Solutions**:
1. Check if Supabase project is active
2. Verify connection string in `.env.local`
3. Check firewall/network settings
4. Ensure pooler is enabled (port 6543)

### Missing API Keys

**Problem**: `supabaseKey is required`

**Solution**:
1. Get keys from: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api
2. Add to `.env.local` and restart dev server

### Type Safety Issues

**Problem**: TypeScript errors with Supabase queries

**Solution**: Generate types

```bash
# Install Supabase CLI
npm install -g supabase

# Generate TypeScript types
npx supabase gen types typescript \
  --project-id aczlassjkbtwenzsohwm \
  > lib/database.types.ts
```

Then update `lib/supabase.ts`:

```typescript
import { Database } from './database.types';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

---

## Next Steps

### Immediate

1. ✅ Get Supabase API keys from dashboard
2. ✅ Update `.env.local` with real keys
3. ✅ Run test script to verify connection
4. ✅ Update Vercel environment variables

### Optional Enhancements

1. 🔄 Enable real-time for specific features
2. 🔒 Set up Row Level Security policies
3. 📁 Configure Supabase Storage for file uploads
4. 📊 Generate TypeScript types for full type safety
5. 🎯 Create Supabase Edge Functions if needed

### Resources

- 📘 Supabase Docs: https://supabase.com/docs
- 📘 Prisma Docs: https://www.prisma.io/docs
- 🎥 Supabase YouTube: https://www.youtube.com/@Supabase
- 💬 Supabase Discord: https://discord.supabase.com

---

## Summary

✅ **Migration Complete!**

Your database is now set up with a hybrid Prisma + Supabase approach:

- **Prisma** handles standard database operations (existing code unchanged)
- **Supabase** adds real-time, storage, and edge capabilities (optional)
- **Zero breaking changes** to your existing application
- **Flexible** - Use whichever client makes sense for each feature

**Next**: Get your API keys from the Supabase dashboard and start exploring real-time features!
