# Media Upload Issue - Complete Fix

## Problem Summary
Staff cannot upload media anywhere in the site (Post Editor, Page Editor, Media Library, etc.)

## Root Cause
**Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable** causes the upload API to fail when initializing the admin Supabase client.

When `/api/media/upload` tries to call `supabaseAdmin()`, it throws an error: `SUPABASE_SERVICE_ROLE_KEY is not set`

## Impact
- ❌ All media uploads fail for all users (EDITOR, AUTHOR, SOCIAL_TEAM, ADMIN, SUPER_ADMIN)
- ❌ Post/Page editors cannot insert images
- ❌ Media library upload button doesn't work
- ❌ Magazine cover manager cannot upload covers

## Solution

### 1. Add Supabase Environment Variables

#### For Local Development (.env.local)
Add these lines to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://aczlassjkbtwenzsohwm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[get from Supabase]"
SUPABASE_SERVICE_ROLE_KEY="[get from Supabase]"
```

#### For Production (Vercel)
Add the same variables in **Vercel Dashboard**:

1. Go to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
2. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://aczlassjkbtwenzsohwm.supabase.co`
   - Environments: Production, Preview, Development

   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: [your anon key]
   - Environments: Production, Preview, Development

   - Name: `SUPABASE_SERVICE_ROLE_KEY` **⚠️ CRITICAL**
   - Value: [your service role key]
   - Environments: Production, Preview, Development

3. Redeploy the app after adding variables

### 2. Get Supabase Keys

1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api
2. Copy these values:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

### 3. Update Database RLS Policies (Optional but Recommended)

The current RLS policies reference a non-existent 'STAFF' role. Update to 'SOCIAL_TEAM':

```bash
# Run the migration script
npx tsx -e "$(cat supabase/migrations/fix_media_rls_policies.sql)"
```

Or apply manually in Supabase SQL Editor:
1. Go to: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql/new
2. Paste and run: `supabase/migrations/fix_media_rls_policies.sql`

### 4. Verify the Fix

Run the diagnostic test:
```bash
npx tsx scripts/test-media-upload.ts
```

Expected output:
```
✅ Supabase Admin client initialized
✅ Database connection working
✅ Media INSERT successful
✅ Test cleanup successful
```

## Why This Happened

The project was migrated from Prisma/Vercel Postgres to Supabase, but:
1. Supabase environment variables were never added to `.env.example`
2. Production environment variables were never configured in Vercel
3. The upload endpoint uses `supabaseAdmin()` which requires the service role key

## Files Modified

1. ✅ `.env.example` - Added Supabase configuration section
2. ✅ `pages/api/media/[id].ts` - Added AUTHOR and SOCIAL_TEAM to permissions
3. ✅ `supabase/migrations/create_media_table.sql` - Fixed 'STAFF' → 'SOCIAL_TEAM'
4. ✅ `supabase/migrations/fix_media_rls_policies.sql` - Migration to fix existing policies

## Testing Checklist

After applying the fix:

- [ ] Local development uploads work
- [ ] Production uploads work
- [ ] EDITOR can upload and manage media
- [ ] AUTHOR can upload and manage media
- [ ] SOCIAL_TEAM can upload and manage media
- [ ] Post editor image insertion works
- [ ] Page editor image insertion works
- [ ] Media library upload works
- [ ] Magazine cover manager upload works

## Additional Notes

- The fix to `pages/api/media/[id].ts` allows AUTHOR and SOCIAL_TEAM roles to view/edit/delete media
- This complements the earlier fix allowing all authenticated users to upload
- RLS policies are bypassed when using `supabaseAdmin()` so they're only enforced for client-side requests

## Support

If uploads still fail after applying this fix:
1. Check browser console for error messages
2. Check Vercel logs: `vercel logs [deployment-url]`
3. Verify environment variables are set: `vercel env ls`
4. Run diagnostic: `npx tsx scripts/test-media-upload.ts`
