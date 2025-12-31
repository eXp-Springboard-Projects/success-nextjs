# Automated Daily Sync Setup

This document explains how the SUCCESS Next.js site automatically syncs with success.com daily to mirror content exactly.

---

## Overview

The site uses a **multi-layer synchronization strategy** to ensure it always matches success.com:

1. **Incremental Static Regeneration (ISR)** - Hourly automatic updates
2. **Daily Cron Job** - Full site revalidation at 2 AM EST daily
3. **WordPress REST API** - Real-time content fetching from success.com

---

## 1. Incremental Static Regeneration (ISR)

### What It Does
ISR automatically regenerates pages when they receive traffic and the revalidation period has expired.

### Configuration
All pages use `revalidate` in `getStaticProps`:

```typescript
export async function getStaticProps() {
  // Fetch data from WordPress API
  const data = await fetchWordPressData('posts?_embed&per_page=30');

  return {
    props: { data },
    revalidate: 3600, // Regenerate page every 1 hour
  };
}
```

### Pages with ISR Enabled
- **Homepage** (`/`) - Revalidate: 3600s (1 hour)
- **Blog Posts** (`/blog/[slug]`) - Revalidate: 3600s
- **Categories** (`/category/[slug]`) - Revalidate: 3600s
- **Authors** (`/author/[slug]`) - Revalidate: 3600s
- **Videos** (`/video/[slug]`) - Revalidate: 3600s
- **Podcasts** (`/podcast/[slug]`) - Revalidate: 3600s
- **Static Pages** - Revalidate: 86400s (24 hours)

### How It Works
1. User visits a page (e.g., `/blog/some-article`)
2. Next.js serves the cached static version
3. In the background, Next.js checks if revalidation time has passed
4. If yes, Next.js fetches fresh data from WordPress API
5. Next.js regenerates the page with new data
6. Next visitor gets the updated version

---

## 2. Daily Cron Job

### What It Does
A Vercel Cron job runs every day at 2 AM EST to force-revalidate all critical pages, ensuring the entire site is fresh daily.

### Configuration

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Cron Schedule:** `0 2 * * *` = Every day at 2:00 AM UTC (9 PM EST / 10 PM EDT)

### Cron Job Endpoint

**File:** `pages/api/cron/daily-sync.js`

**What It Does:**
1. Verifies request is from Vercel Cron (security check)
2. Revalidates homepage (`/`)
3. Revalidates all category pages
4. Revalidates static pages (magazine, videos, podcasts, store, success+)
5. Fetches 20 most recent blog posts and revalidates them
6. Returns summary of revalidation results

**Sample Response:**
```json
{
  "success": true,
  "message": "Daily sync completed",
  "results": {
    "timestamp": "2025-10-29T02:00:00.000Z",
    "revalidated": [
      "/",
      "/category/business",
      "/category/money",
      "/magazine",
      "/blog/latest-article",
      "..."
    ],
    "latestPostsCount": 20,
    "errors": []
  }
}
```

### Security
The cron endpoint requires authentication:

```javascript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Required Environment Variable:**
```
CRON_SECRET=your-secure-random-string-here
```

Generate with: `openssl rand -base64 32`

---

## 3. WordPress API Integration

### API Client
**File:** `lib/wordpress.js`

**Features:**
- Automatic retry with exponential backoff (5 attempts)
- In-memory caching (60s TTL during builds)
- Rate limit handling
- Error logging

**Usage:**
```javascript
import { fetchWordPressData } from '../lib/wordpress';

// Fetch posts
const posts = await fetchWordPressData('posts?_embed&per_page=20');

// Fetch by category
const businessPosts = await fetchWordPressData('posts?categories=4&_embed&per_page=3');

// Fetch custom post type
const videos = await fetchWordPressData('videos?_embed&per_page=10');
```

### WordPress Endpoints Used
```
GET /wp-json/wp/v2/posts               - Blog posts
GET /wp-json/wp/v2/categories          - Categories
GET /wp-json/wp/v2/users               - Authors
GET /wp-json/wp/v2/videos              - Video custom post type
GET /wp-json/wp/v2/podcasts            - Podcast custom post type
GET /wp-json/wp/v2/magazines           - Magazine custom post type
GET /wp-json/wp/v2/bestsellers         - Bestsellers custom post type
```

### Category IDs
```
Business: 4
Money: 14060
Lifestyle: 14056
Entertainment: 14382
Health & Wellness: 14059
Future of Work: 14061
```

---

## 4. Setup Instructions

### Step 1: Configure Environment Variables

**Required in Vercel:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add these variables:

```
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
CRON_SECRET=[generate with: openssl rand -base64 32]
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://success-nextjs.vercel.app
```

### Step 2: Deploy to Vercel

```bash
# Commit all changes
git add .
git commit -m "Add automated daily sync system"
git push origin main

# Vercel will auto-deploy
```

### Step 3: Verify Cron Job Setup

1. Go to Vercel Dashboard → Project → Cron Jobs
2. Verify you see: `daily-sync` scheduled for `0 2 * * *`
3. Status should be "Active"

### Step 4: Test Cron Job Manually

```bash
# From your terminal
curl -X GET "https://success-nextjs.vercel.app/api/cron/daily-sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "message": "Daily sync completed",
  "results": {...}
}
```

### Step 5: Monitor Cron Execution

**View Cron Logs:**
1. Vercel Dashboard → Project → Deployments
2. Click on "Functions" tab
3. Find `/api/cron/daily-sync`
4. View execution logs and results

---

## 5. How It All Works Together

### Daily Cycle

**12:00 AM - 2:00 AM EST**
- ISR continues serving cached pages
- Any page visited gets revalidated if 1 hour has passed

**2:00 AM EST**
- Vercel Cron triggers `/api/cron/daily-sync`
- All critical pages force-revalidated
- Latest content from success.com pulled
- Cache updated site-wide

**2:00 AM - 11:59 PM EST**
- Site serves fresh content from morning sync
- ISR handles individual page updates as needed
- Any new content published on success.com appears within 1 hour

### Content Update Flow

```
success.com publishes new article
           ↓
WordPress REST API updated
           ↓
SUCCESS Next.js checks API (hourly ISR or daily cron)
           ↓
New content fetched and page regenerated
           ↓
Visitors see updated content
```

### Fallback Strategy

If WordPress API is down or slow:
1. **ISR** - Serves last successful static generation (never shows error to users)
2. **Cron** - Retries with exponential backoff (5 attempts)
3. **Cache** - In-memory cache prevents redundant API calls during builds

---

## 6. Customization Options

### Change Sync Frequency

**Option A: More Frequent (Every 30 Minutes)**
```typescript
// pages/index.tsx
revalidate: 1800, // 30 minutes
```

**Option B: Multiple Daily Syncs**
```json
// vercel.json
"crons": [
  {
    "path": "/api/cron/daily-sync",
    "schedule": "0 2,8,14,20 * * *"  // 2 AM, 8 AM, 2 PM, 8 PM
  }
]
```

**Option C: Hourly Sync**
```json
// vercel.json
"crons": [
  {
    "path": "/api/cron/daily-sync",
    "schedule": "0 * * * *"  // Every hour at :00
  }
]
```

### Add More Pages to Daily Sync

Edit `pages/api/cron/daily-sync.js`:

```javascript
// Add more static pages
const staticPages = [
  '/magazine',
  '/videos',
  '/podcasts',
  '/bestsellers',
  '/speakers',
  '/success-plus',
  '/store',
  '/about',        // NEW
  '/contact',      // NEW
  '/subscribe',    // NEW
];
```

### Sync Specific Categories Only

```javascript
// In daily-sync.js
const categories = [
  'business',
  'money',
  'lifestyle',
  // Remove others if not needed
];
```

---

## 7. Monitoring & Troubleshooting

### Check if Sync is Working

**1. View Latest Sync Time**
```bash
# Check Vercel Function Logs
vercel logs --function=/api/cron/daily-sync
```

**2. Compare with success.com**
- Visit both sites side-by-side
- Verify latest articles match
- Check timestamps on posts

**3. Check ISR Status**
```bash
# View Next.js build analytics
npm run build -- --profile
```

### Common Issues

**Issue: Cron job not running**
- **Cause:** Missing `CRON_SECRET` environment variable
- **Fix:** Add `CRON_SECRET` to Vercel environment variables

**Issue: Pages not updating**
- **Cause:** ISR revalidation time too long
- **Fix:** Reduce `revalidate` value in `getStaticProps`

**Issue: WordPress API rate limiting**
- **Cause:** Too many requests to success.com API
- **Fix:** Increase delays in `lib/wordpress.js` retry logic

**Issue: Build timeouts**
- **Cause:** Too many pages being generated at once
- **Fix:** Use `fallback: 'blocking'` instead of pre-rendering all paths

---

## 8. Performance Impact

### Current Configuration Impact

**Build Time:**
- Initial build: ~10-15 minutes (generates homepage + key pages)
- Incremental rebuilds: ~30 seconds per page

**API Requests:**
- Homepage: ~15 API calls (various categories, posts, videos, podcasts)
- Blog post: 2-3 API calls (post data, related posts)
- Daily cron: ~50-100 API calls (revalidating all pages)

**Server Load:**
- ISR: Near-zero (only when revalidation needed)
- Cron: 1-2 minutes of CPU time daily
- API: Requests spread over time, no spikes

### Optimization Tips

1. **Reduce API calls** - Bundle related requests
2. **Increase cache TTL** - Longer in-memory cache in `lib/wordpress.js`
3. **Selective sync** - Only revalidate pages that change frequently
4. **CDN caching** - Vercel Edge Network caches static pages globally

---

## 9. Testing Checklist

Before deploying to production, verify:

- [ ] Environment variables set in Vercel
- [ ] `CRON_SECRET` generated and secure
- [ ] Cron job appears in Vercel dashboard
- [ ] Manual cron test succeeds (`curl` with Bearer token)
- [ ] Homepage displays latest content
- [ ] Blog posts load correctly
- [ ] Categories show correct posts
- [ ] ISR revalidation working (test by waiting 1 hour)
- [ ] No build errors in Vercel logs
- [ ] WordPress API accessible and responsive
- [ ] Monitor first few cron executions for errors

---

## 10. Maintenance

### Weekly Tasks
- [ ] Check Vercel Function Logs for cron errors
- [ ] Verify latest articles appear on site
- [ ] Monitor API response times

### Monthly Tasks
- [ ] Review and optimize ISR revalidation times
- [ ] Check for new WordPress API endpoints to sync
- [ ] Update category IDs if changed on success.com
- [ ] Review cache hit rates and optimize

### As Needed
- [ ] Add new pages to cron revalidation list
- [ ] Update WordPress API URL if domain changes
- [ ] Rotate `CRON_SECRET` if compromised

---

## Summary

Your SUCCESS Next.js site now:

✅ **Automatically syncs** with success.com every day at 2 AM EST
✅ **Fetches fresh content** from WordPress REST API hourly via ISR
✅ **Mirrors content exactly** - same posts, categories, structure
✅ **Runs simultaneously** - both sites show same content
✅ **Self-healing** - retries on API failures, serves cached content if needed
✅ **Zero manual work** - fully automated synchronization

The site will always stay in sync with success.com with no manual intervention required.
