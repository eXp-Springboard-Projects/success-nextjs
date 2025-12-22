# Supabase Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your API Keys

1. Visit: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api
2. Copy these two keys:
   - **`anon` / `public`** key
   - **`service_role`** key

### Step 2: Update Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aczlassjkbtwenzsohwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Test Connection

```bash
npx tsx scripts/test-supabase-connection.ts
```

### Step 4: Use in Your Code

```typescript
// Server-side or client-side queries
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10);
```

---

## 💡 Common Use Cases

### Query Data

```typescript
import { supabase } from '@/lib/supabase';

// Simple select
const { data, error } = await supabase
  .from('posts')
  .select('id, title, author')
  .eq('status', 'PUBLISHED')
  .order('publishedAt', { ascending: false })
  .limit(10);
```

### Insert Data

```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    postId: '123',
    author: 'John Doe',
    content: 'Great article!'
  })
  .select()
  .single();
```

### Real-time Updates

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function MyComponent() {
  useEffect(() => {
    const channel = supabase
      .channel('my-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => console.log('Change detected!', payload)
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);
}
```

### Admin Operations (Server-side Only)

```typescript
import { supabaseAdmin } from '@/lib/supabase';

// API route only! Never expose service role key to client
export default async function handler(req, res) {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('email', 'admin@example.com');

  res.json({ data, error });
}
```

---

## 🎯 When to Use Prisma vs Supabase

### Use Prisma For:
- ✅ Complex joins and relations
- ✅ Type-safe TypeScript queries
- ✅ Transactions
- ✅ Existing API routes

### Use Supabase For:
- ✅ Real-time subscriptions
- ✅ Simple CRUD operations
- ✅ File uploads (Storage)
- ✅ Row Level Security

**You can use BOTH in the same application!**

---

## 📚 Full Documentation

See [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) for complete details.

---

## ⚡ Quick Commands

```bash
# Test connection
npx tsx scripts/test-supabase-connection.ts

# Generate TypeScript types (optional)
npx supabase gen types typescript --project-id aczlassjkbtwenzsohwm > lib/database.types.ts

# Prisma commands (still work!)
npx prisma studio
npx prisma migrate dev
```

---

## 🔗 Important Links

- **Supabase Dashboard**: https://app.supabase.com/project/aczlassjkbtwenzsohwm
- **API Settings**: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api
- **Database**: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor
- **SQL Editor**: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql
