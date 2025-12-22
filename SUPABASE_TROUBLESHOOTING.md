# Supabase Connection Troubleshooting

## ❌ Current Issue

**Error**: `Can't reach database server at db.aczlassjkbtwenzsohwm.supabase.co:6543`

This means the Supabase project is either:
1. **Paused** (most likely on free tier)
2. **Not fully set up**
3. **Network/firewall issue**

---

## ✅ Solutions (Try in Order)

### 1. Check if Supabase Project is Paused

**Supabase free tier projects pause after inactivity.**

**Action:**
1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm
2. Look for a "Resume" or "Restore" button
3. Click it to activate the project
4. Wait 1-2 minutes for the database to start

**Then retry:**
```bash
npx prisma db push
```

### 2. Verify Database Password

The password in your `.env` files contains special characters: `vc3NUeQMck5!Ae`

**Possible Issue**: The `!` might need URL encoding.

**Try this in `.env.local`:**
```bash
# Original
DATABASE_URL="postgres://postgres:vc3NUeQMck5!Ae@db.aczlassjkbtwenzsohwm.supabase.co:6543/postgres"

# URL encoded version (! becomes %21)
DATABASE_URL="postgres://postgres:vc3NUeQMck5%21Ae@db.aczlassjkbtwenzsohwm.supabase.co:6543/postgres"
```

**Then retry:**
```bash
npx prisma db push
```

### 3. Try Direct Connection (Port 5432)

The pooler (port 6543) might be down. Try the direct connection:

**Update `prisma/schema.prisma`:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DIRECT_URL")  // Changed from DATABASE_URL
  directUrl = env("DIRECT_URL")
}
```

**Then retry:**
```bash
npx prisma db push
```

### 4. Get Fresh Connection String from Supabase

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/database
2. Look for "Connection string" section
3. Select "Session mode" (pooler) or "Transaction mode"
4. Copy the connection string
5. Replace `DATABASE_URL` in `.env.local`

### 5. Check Project Settings

**Dashboard URL**: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/general

Check:
- ✅ Project is not paused
- ✅ Project region is accessible from your location
- ✅ No pending issues or maintenance

### 6. Test with psql (Optional)

If you have PostgreSQL client installed:

```bash
# Test connection directly
psql "postgres://postgres:vc3NUeQMck5!Ae@db.aczlassjkbtwenzsohwm.supabase.co:6543/postgres"
```

---

## 🔍 Alternative: Check Existing Database

Maybe the database is already set up with tables?

### Option A: Use Supabase Dashboard

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor
2. Click "Table Editor" on the left
3. Do you see any tables?

### Option B: Use Supabase SQL Editor

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql
2. Run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

If you see tables listed, your database is already set up!

---

## 🆕 Alternative: Create New Supabase Project

If the project `aczlassjkbtwenzsohwm` is not accessible, you can create a fresh one:

### Step 1: Create Project

1. Go to: https://app.supabase.com/projects
2. Click "New Project"
3. Fill in:
   - **Name**: success-nextjs
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### Step 2: Get Connection Strings

1. Go to Settings > Database
2. Copy:
   - **Connection pooling** → Use this for `DATABASE_URL`
   - **Direct connection** → Use this for `DIRECT_URL`

### Step 3: Update .env Files

Update `.env.local` and `.env.production`:
```bash
DATABASE_URL="<your-pooling-connection-string>"
DIRECT_URL="<your-direct-connection-string>"
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 4: Push Schema

```bash
npx prisma db push
```

---

## 📞 Get Supabase Support

If none of the above works:

1. **Check Status**: https://status.supabase.com/
2. **Discord**: https://discord.supabase.com
3. **Email**: support@supabase.io
4. **Docs**: https://supabase.com/docs/guides/database

Provide them with:
- Project ID: `aczlassjkbtwenzsohwm`
- Error message: "Can't reach database server"
- Your location/region

---

## 🎯 Expected Result

After successful connection, you should see:

```
✅ Your database is now in sync with your Prisma schema.
```

Then:
- Open Supabase dashboard
- Go to Table Editor
- See all 100+ tables created

---

## Next Steps After Connection Works

1. ✅ Get Supabase API keys from dashboard
2. ✅ Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
3. ✅ Run `npx tsx scripts/test-supabase-connection.ts`
4. ✅ Start building with real-time features!

---

**Most Likely Issue**: Project is paused (free tier auto-pauses after 1 week of inactivity)

**Quick Fix**: Resume project in Supabase dashboard → https://app.supabase.com/project/aczlassjkbtwenzsohwm
