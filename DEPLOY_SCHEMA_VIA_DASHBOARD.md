# Deploy Schema via Supabase Dashboard

## Problem: Database Port Blocked

Your machine cannot connect to Supabase PostgreSQL port (5432). This is likely due to:
- Corporate firewall
- Network restrictions
- VPN configuration
- Windows Firewall settings

## Solution: Use Supabase SQL Editor

Instead of pushing schema via Prisma (which requires port 5432), we'll use Supabase's web-based SQL editor.

---

## 📋 Step-by-Step Instructions

### Step 1: Generate SQL Schema

The SQL schema file has been generated: `supabase-schema.sql`

### Step 2: Open Supabase SQL Editor

👉 Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql/new

### Step 3: Copy & Run SQL

1. Open `supabase-schema.sql` from your project folder
2. Copy the entire contents
3. Paste into the SQL Editor in Supabase
4. Click **"Run"** or press `Ctrl+Enter`

### Step 4: Verify Tables Created

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor
2. You should now see 100+ tables!

---

## Alternative: Use Prisma Migrate Deploy (If You Have VPN/Different Network)

If you can access port 5432 from a different network:

```bash
# Try from mobile hotspot or different network
npx prisma migrate deploy
```

---

## After Tables Are Created

Once tables exist in Supabase:

### Test Connection

```bash
npx tsx scripts/test-supabase-connection.ts
```

### Update Vercel Environment Variables

Add these to Vercel:
```
DATABASE_URL=postgresql://postgres:100vc3NUeQMck5!Ae@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://aczlassjkbtwenzsohwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_kZUAvQSB8BuazLUykMiDIA_6yfshoPu
SUPABASE_SERVICE_ROLE_KEY=sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK
```

### Start Using Supabase!

You're all set! The app will connect to Supabase from Vercel (no port restrictions there).

---

## 🎉 Done!

Your Prisma + Supabase hybrid setup is complete!
