# Posts Architecture - Local vs WordPress

## Overview

This document explains how blog posts are handled in the SUCCESS Next.js application and clarifies which posts are stored locally versus fetched from WordPress.

## How Posts Work

### URL Structure
All blog posts are accessible at the root level: `https://www.success.com/[slug]`

For example:
- `/overcome-imposter-syndrome-5-step-plan`
- `/how-emotional-intelligence-transforms-leadership`

### Content Resolution Order

When a user visits `https://www.success.com/[slug]`, the system checks in this order:

1. **Database Pages Table** (`pages` in Supabase)
   - Static pages like `/about-us`, `/daily-sms`, etc.
   - Status: Stored locally

2. **Database Posts Table** (`posts` in Supabase)
   - Blog articles imported from WordPress
   - Status: Stored locally with full content

3. **WordPress Pages API** (`https://successcom.wpenginepowered.com/wp-json/wp/v2/pages`)
   - Fallback for pages not yet migrated
   - Status: Linked to WordPress (fetched dynamically)

4. **WordPress Posts API** (`https://successcom.wpenginepowered.com/wp-json/wp/v2/posts`)
   - Fallback for blog posts not yet imported
   - Status: Linked to WordPress (fetched dynamically)

## Local vs WordPress Posts

### Local Posts (Stored in Supabase)

**Characteristics:**
- ✅ Stored in the `posts` table in Supabase database
- ✅ Full content, metadata, and images stored locally
- ✅ **FULLY EDITABLE via admin panel** - edit title, content, images, categories, etc.
- ✅ Faster loading (no external API calls)
- ✅ Searchable and filterable
- ✅ May include WordPress metadata (`wordpressId` field if imported)

**Types of local posts:**
1. **Imported from WordPress:** Have `wordpressId` field, fully editable after import
2. **Created directly in admin:** No `wordpressId`, native to our system

**Where they appear:**
- Admin Content Viewer (`/admin/content-viewer`) - shows ALL local posts (both imported and native)
- Individual post pages (e.g., `/post-slug`)
- Homepage and category pages

**IMPORTANT:** Once a WordPress post is imported to Supabase, it becomes a local post and is fully editable via the admin dashboard. You have complete control over imported posts.

### WordPress Posts (NOT Imported - Linked Out)

**Characteristics:**
- ⚠️ Not stored in Supabase database
- ⚠️ Fetched from WordPress API on each page load
- ⚠️ **Cannot be edited via our admin panel** (read-only)
- ⚠️ Slower loading (requires API call)
- ⚠️ Dependent on WordPress site availability
- ⚠️ Fallback only - used when post slug not found in database

**How they work:**
- If a post slug isn't found in Supabase, the system queries WordPress API
- Content is rendered dynamically from WordPress response
- No permanent storage in our database
- These are posts that haven't been imported yet

**Where they appear:**
- Individual post pages (e.g., `/post-slug`) - ONLY if not in database
- **NOT shown in Admin Content Viewer** (only local posts show there)
- MAY appear on homepage/category pages if fetched via API

## Admin Content Viewer

**Location:** `/admin/content-viewer`

**What it shows:**
- All posts from Supabase `posts` table
- All pages from Supabase `pages` table
- All videos from Supabase `videos` table
- All podcasts from Supabase `podcasts` table

**Pagination:**
- Now fetches ALL posts across multiple pages (100 per page)
- No longer limited to first 100 items
- Shows exact count of items fetched from each endpoint

**What it DOES NOT show:**
- WordPress posts that haven't been imported to Supabase
- Draft or unpublished content on WordPress

## Import Status

To check how many posts are imported vs. available on WordPress:

```bash
# Count local posts
DATABASE_URL="..." npx tsx -e "
import { supabaseAdmin } from './lib/supabase.js';
const { count } = await supabaseAdmin().from('posts').select('*', { count: 'exact', head: true });
console.log('Local posts:', count);
"

# Count WordPress posts (via API)
curl -s "https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?per_page=1" -I | grep x-wp-total
```

## How to Import More Posts

If you need to import additional posts from WordPress to Supabase:

1. **Use the Content Importer** (`/admin/content-importer`)
   - Imports posts, pages, videos, and podcasts from WordPress
   - Preserves all metadata, images, and categories

2. **Run Import Script:**
   ```bash
   DATABASE_URL="..." npx tsx scripts/import-wordpress-content.ts 10000
   ```

## Benefits of Local Storage

**Why import posts to Supabase instead of always fetching from WordPress?**

1. **Performance:** No external API calls = faster page loads
2. **Reliability:** Works even if WordPress site is down
3. **Editability:** Can be edited via admin panel
4. **Search:** Full-text search across all content
5. **Analytics:** Track views, bookmarks, and engagement
6. **Control:** Complete ownership of content

## Summary

- **Local Posts:** Stored in Supabase, editable, fast, searchable
- **WordPress Posts:** Fetched dynamically, read-only, slower, fallback only
- **Admin Viewer:** Shows only local content (Supabase tables)
- **Frontend:** Shows both local and WordPress posts seamlessly

**Recommendation:** Import all WordPress posts to Supabase for best performance and control.
