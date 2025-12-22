# Supabase Setup - Step by Step

## Current Situation

You have the connection string from Supabase:
```
postgresql://postgres:[YOUR-PASSWORD]@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres
```

But the database is not responding to connection attempts.

---

## ✅ Step-by-Step Solution

### Step 1: Check Supabase Project Status

1. **Go to your Supabase dashboard:**
   - https://app.supabase.com/project/aczlassjkbtwenzsohwm

2. **Look for these indicators:**
   - 🟢 Green indicator = Active
   - 🟡 Yellow "Paused" badge = Need to resume
   - 🔴 Red = Issue with project

3. **If paused:**
   - Click "Resume" or "Restore Project" button
   - Wait 1-2 minutes for database to start
   - Refresh the page

### Step 2: Verify Database Settings

1. **Go to Database Settings:**
   - https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/database

2. **Check:**
   - Database is running
   - Connection pooling is enabled
   - Note down the connection strings

3. **Look for two types of connection strings:**
   - **Direct connection** (port 5432) - for migrations
   - **Connection pooling** (port 6543) - for app runtime

### Step 3: Get the Correct Connection Strings

In the Database Settings page, you should see:

**Connection String:**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Or Session Mode:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres
```

**Copy both!**

### Step 4: Update Your .env Files

Update `C:\Users\RachelNead\success-next\.env`:

```bash
# Database - Supabase
DATABASE_URL="postgresql://postgres:vc3NUeQMck5!Ae@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:vc3NUeQMck5!Ae@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres"
```

**Note:** Replace `vc3NUeQMck5!Ae` with your actual password if different.

### Step 5: Test Connection

```bash
# Test if database is reachable
npx prisma db push --skip-generate
```

**Expected Success:**
```
✅ Your database is now in sync with your Prisma schema.
```

**If still failing:**
- Project might still be starting (wait 2-3 minutes)
- Password might be wrong
- Project might be in a different region/restricted

### Step 6: Push Schema to Create Tables

Once connection works:

```bash
# Create all tables in Supabase
npx prisma db push
```

This will create 100+ tables in your Supabase database.

### Step 7: Verify Tables in Supabase

1. **Go to Table Editor:**
   - https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor

2. **You should see tables like:**
   - users
   - posts
   - categories
   - subscriptions
   - members
   - etc.

### Step 8: Get API Keys

1. **Go to API Settings:**
   - https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api

2. **Copy these keys:**
   - **`anon` / `public` key** - Safe for client-side
   - **`service_role` key** - Server-side only (never expose!)

3. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-real-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-real-service-role-key
   ```

### Step 9: Test Everything

```bash
# Test both Prisma and Supabase connections
npx tsx scripts/test-supabase-connection.ts
```

**Expected output:**
```
✅ Prisma connected! Found X users in database
✅ Supabase connected! Database is accessible
✅ Both clients are reading from the same database!
```

---

## 🔍 Alternative: Check if Database Already Has Tables

Maybe the database already has tables from a previous setup?

### Check via SQL Editor

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql
2. Run:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

If you see tables listed, your database is already set up! Skip to Step 8.

---

## ❌ Troubleshooting

### Issue 1: "Can't reach database server"

**Causes:**
- Project is paused (most common)
- Network/firewall blocking connection
- Wrong password
- Project is provisioning (new projects take 2-3 min)

**Solutions:**
1. Resume project in dashboard
2. Wait 2-3 minutes and retry
3. Check password is correct
4. Try from a different network (VPN, mobile hotspot)

### Issue 2: Password Special Characters

The password `vc3NUeQMck5!Ae` contains `!` which might need encoding.

**Try URL encoded version:**
```bash
# In .env files, replace ! with %21
DATABASE_URL="postgresql://postgres:vc3NUeQMck5%21Ae@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres"
```

### Issue 3: Wrong Project

Are you sure `aczlassjkbtwenzsohwm` is the correct project ID?

**Check:**
1. Go to: https://app.supabase.com/projects
2. Find your SUCCESS project
3. Verify the URL matches

### Issue 4: Free Tier Limitations

Supabase free tier has auto-pause after 1 week of inactivity.

**Solution:**
- Upgrade to Pro ($25/month) for always-on database
- Or manually resume weekly
- Or consider paid tier

---

## 🆕 Nuclear Option: Create Fresh Supabase Project

If the existing project is inaccessible:

### Create New Project

1. **Go to:** https://app.supabase.com/projects
2. **Click:** "New Project"
3. **Fill in:**
   - Name: `success-nextjs`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
4. **Click:** "Create new project"
5. **Wait:** 2-3 minutes for provisioning

### Get New Connection Strings

1. **Settings → Database**
2. **Copy:**
   - Direct connection
   - Pooling connection
3. **Update all `.env` files with new values**

### Push Schema

```bash
npx prisma db push
```

---

## 📞 Still Stuck?

**Supabase Support:**
- Discord: https://discord.supabase.com
- Email: support@supabase.io
- Status: https://status.supabase.com

**Provide them:**
- Project ID: `aczlassjkbtwenzsohwm`
- Error: "Can't reach database server at port 5432"
- Your location/timezone

---

## ✅ Success Checklist

Once everything works:

- [ ] Supabase project is active (not paused)
- [ ] Connection test passes
- [ ] Schema pushed (`npx prisma db push`)
- [ ] Tables visible in Supabase dashboard
- [ ] API keys copied and saved
- [ ] `.env.local` updated with API keys
- [ ] Test script passes (`npx tsx scripts/test-supabase-connection.ts`)
- [ ] Ready to build with Prisma + Supabase! 🎉

---

**Most likely next step:** Resume your Supabase project in the dashboard!
