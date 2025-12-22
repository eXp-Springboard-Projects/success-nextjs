# Push Your Schema to Supabase

## Why You Don't See Tables in Supabase Dashboard

Your database connection is configured to use Supabase, BUT the schema (tables) haven't been pushed yet.

## Solution: Run Prisma Migrations

### Step 1: Verify Connection

```bash
# This will test if Prisma can connect to Supabase
npx prisma db pull
```

If this works, you'll see your schema synced.

### Step 2: Push Schema to Supabase

```bash
# Push your Prisma schema to Supabase database
npx prisma db push
```

This will create all 100+ tables in your Supabase database.

### Step 3: Verify in Supabase Dashboard

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor
2. You should now see all your tables:
   - users
   - posts
   - subscriptions
   - categories
   - etc.

## Alternative: Apply Migrations

If you have migration files in `prisma/migrations/`:

```bash
# Apply all migrations to Supabase
npx prisma migrate deploy
```

## Troubleshooting

### Error: Can't reach database server

**Solution**: The Supabase database might be paused. Check:
- https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/general

Click "Resume project" if it's paused.

### Error: Database already exists

This means tables are already there! Check:
- https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor

### Want to Start Fresh?

```bash
# Reset the database (WARNING: DELETES ALL DATA!)
npx prisma migrate reset

# Then push schema
npx prisma db push
```

## After Schema is Pushed

Once your tables are in Supabase, you can:
- ✅ View/edit data in Supabase dashboard
- ✅ Use Supabase client for queries
- ✅ Set up real-time subscriptions
- ✅ Configure Row Level Security
- ✅ Use Supabase Storage

## Quick Commands

```bash
# Check if database is accessible
npx prisma db pull

# Push schema to database
npx prisma db push

# Open Prisma Studio (local GUI)
npx prisma studio

# Test connections
npx tsx scripts/test-supabase-connection.ts
```

---

**Next Step**: Run `npx prisma db push` to create your tables in Supabase!
