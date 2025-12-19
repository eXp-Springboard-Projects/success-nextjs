# WordPress Import & Admin Setup

## Quick Start (Do This Now!)

### 1. Install Dependencies
```bash
npm install node-fetch bcryptjs
npm install -D @types/node-fetch @types/bcryptjs tsx
```

### 2. Set Environment Variable
Add to `.env.local`:
```bash
WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2
DATABASE_URL="postgres://YOUR_DATABASE_URL_HERE"
```

### 3. Run Import Scripts
```bash
# Option A: Import everything at once
npm run import:all

# Option B: Step by step
npm run seed:admins           # Create admin users (1 minute)
npm run import:wordpress      # Import WordPress content (5-10 minutes)
npm run import:wordpress 100 # Import only first 100 posts
```

---

## What Gets Imported

### WordPress Content Import
✅ **Categories** - All WordPress categories with hierarchy
✅ **Tags** - All post tags
✅ **Authors** - WordPress authors → users table
✅ **Posts** - Posts with content, featured images, categories, tags
✅ **Metadata** - Word count, read time, publish dates

### Admin Users Created
✅ **Rachel (Super Admin)** - Full access to everything
✅ **Editorial Director** - Posts, videos, podcasts
✅ **Customer Service Lead** - Members, orders, refunds
✅ **DevOps Engineer** - System tools, errors, cache
✅ **Marketing Director** - Campaigns, analytics
✅ **Coaching Director** - Coaching programs
✅ **SUCCESS+ Manager** - Premium content

---

## Login Credentials

After running `npm run seed:admins`, you can login with:

| Email                      | Password          | Access Level  |
|---------------------------|-------------------|---------------|
| rachel@success.com         | Admin123!         | Super Admin   |
| editorial@success.com      | Editorial123!     | Editorial     |
| support@success.com        | Support123!       | Customer Service |
| dev@success.com           | DevOps123!        | Dev/DevOps    |
| marketing@success.com     | Marketing123!     | Marketing     |
| coaching@success.com      | Coaching123!      | Coaching      |
| successplus@success.com   | SuccessPlus123!   | SUCCESS+      |

**Login URL:** http://localhost:3000/admin/login

---

## Import Options

### Import Specific Number of Posts
```bash
npm run import:wordpress 100   # Import first 100 posts
npm run import:wordpress 500   # Import first 500 posts (default)
npm run import:wordpress 1000  # Import first 1000 posts
```

### Re-run Import (Updates Existing)
The import script uses **upsert** - it updates existing records instead of creating duplicates. Safe to run multiple times.

```bash
npm run import:wordpress  # Updates existing + imports new
```

---

## What Happens During Import

### Step 1: Categories (~30 seconds)
```
=== IMPORTING CATEGORIES ===
Fetching: https://successcom.wpenginepowered.com/wp-json/wp/v2/categories?page=1&per_page=100
✓ Category: AI & Technology
✓ Category: Business & Branding
✓ Category: Entrepreneurship
...
✓ Imported 45 categories
```

### Step 2: Tags (~1 minute)
```
=== IMPORTING TAGS ===
✓ Tag: Leadership
✓ Tag: Personal Growth
✓ Tag: Success Stories
...
✓ Imported 350 tags
```

### Step 3: Authors (~30 seconds)
```
=== IMPORTING AUTHORS ===
✓ Author: Rachel Nead
✓ Author: SUCCESS Staff
✓ Author: Guest Contributors
...
✓ Imported 25 authors
```

### Step 4: Posts (~5-10 minutes for 500 posts)
```
=== IMPORTING POSTS (limit: 500) ===
Page 1/25 - Total posts in WordPress: 2,500

✓ Post 1/500: How to Build a Morning Routine That Transforms Your Life
✓ Post 2/500: The 5 Habits of Highly Successful Entrepreneurs
✓ Post 3/500: Why AI is Changing the Future of Work
...
✓ Imported 500 posts
```

### Step 5: Update Counts (~10 seconds)
```
=== UPDATING POST COUNTS ===
✓ Updated 45 category counts
✓ Updated 350 tag counts
```

---

## Troubleshooting

### Error: "Cannot find module 'node-fetch'"
```bash
npm install node-fetch @types/node-fetch
```

### Error: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs @types/bcryptjs
```

### Error: "DATABASE_URL environment variable not found"
Add to `.env.local`:
```bash
DATABASE_URL="postgres://YOUR_CONNECTION_STRING"
```

### Error: "WordPress API error: 403"
The WordPress API is public, but if you get 403:
- Check that `WORDPRESS_API_URL` is correct
- Try: `https://successcom.wpenginepowered.com/wp-json/wp/v2`

### Import is Slow
Normal! Importing 500 posts takes 5-10 minutes due to:
- Fetching from WordPress API
- Processing images
- Linking categories/tags
- Rate limiting (500ms between pages)

Speed it up:
```bash
npm run import:wordpress 100  # Import fewer posts
```

---

## After Import

### 1. Verify Data
```bash
# Check what was imported
npm run dev
# Visit: http://localhost:3000/admin
```

### 2. Test Admin Dashboard
- Login: http://localhost:3000/admin/login
- Email: `rachel@success.com`
- Password: `Admin123!`

### 3. Check Dashboards
- Editorial: http://localhost:3000/admin/editorial
- Customer Service: http://localhost:3000/admin/customer-service
- Posts: http://localhost:3000/admin/posts

### 4. View Frontend
- Homepage: http://localhost:3000
- Category: http://localhost:3000/category/ai-technology
- Post: http://localhost:3000/blog/[any-post-slug]

---

## Next Steps

### Import Stripe Data (Optional)
Create `scripts/import-stripe-customers.ts` to import:
- Customers → members table
- Subscriptions → subscriptions table
- Payment history → orders table

### Set Up Ongoing Sync
Create cron job to sync new posts daily:
```bash
# Add to vercel.json or cron
0 2 * * * npm run import:wordpress
```

### Update Dashboard APIs
Fix stub implementations in:
- `pages/api/admin/coaching/dashboard-stats.ts`
- `pages/api/admin/marketing/dashboard-stats.ts`
- `pages/api/admin/editorial/dashboard-stats.ts`

---

## Files Created

```
scripts/
  ├── import-wordpress.ts      ← WordPress content importer
  ├── seed-admin-users.ts      ← Admin user seeder
  └── README_IMPORT.md         ← This file

package.json
  └── scripts:
      ├── import:wordpress     ← Run WordPress import
      ├── seed:admins         ← Create admin users
      └── import:all          ← Run both
```

---

## Support

Questions? Check:
1. Console output for specific errors
2. Database connection in `.env.local`
3. WordPress API availability: https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?per_page=1

**Ready to import?** Run:
```bash
npm install node-fetch bcryptjs tsx
npm run import:all
```
