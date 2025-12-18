# WordPress Decoupling Progress

**Last Updated:** 2025-11-20
**Status:** Phase 3 - Foundation Complete, Ready for Migration

---

## ✅ Completed Steps

### Step 1: Audit Complete
- ✅ Searched entire codebase for WordPress dependencies
- ✅ Identified 30 files with WordPress connections
- ✅ Documented all WordPress REST API endpoints used
- ✅ Categorized by impact (Critical/Medium/Low)
- ✅ **Deliverable:** `WORDPRESS_AUDIT.md`

**Key Findings:**
- 27 page files depend on WordPress
- 1 core library file (`lib/wordpress.js`)
- 2 admin components
- Homepage fetches from 9+ WordPress endpoints
- Daily cron job syncs content
- All public content comes from WordPress REST API

### Step 2: Admin Dashboard Identification
- ✅ Found 4 admin pages pulling from WordPress:
  - `pages/admin/wordpress-sync.tsx` - WordPress sync dashboard
  - `pages/admin/content-viewer.tsx` - Live content browser
  - `pages/admin/settings.tsx` - WordPress API settings
  - `pages/admin/magazine-manager.tsx` - Partial WordPress integration
- ✅ Found 2 admin components:
  - `components/admin/PostsListWithFilters.tsx` - Posts management UI
  - `components/admin/EnhancedPostEditor.tsx` - Post editor

### Step 3: Local Data Management Design
- ✅ Architecture decided: Database-first with Prisma + Admin UI
- ✅ Complete database schema designed
- ✅ Data migration strategy documented
- ✅ API routes specification created
- ✅ Admin UI wireframes documented
- ✅ 5-phase implementation timeline (13-19 days)
- ✅ **Deliverable:** `LOCAL_CMS_DESIGN.md`

### Step 4: Database Schema Extended
- ✅ Added WordPress migration tracking fields to all content models
- ✅ Created `press_releases` table
- ✅ Created `wordpress_migration` tracking table
- ✅ Enhanced models with SEO and social fields
- ✅ Applied schema changes to database (`prisma db push`)
- ✅ Generated new Prisma Client

**New Database Fields:**

**Posts:**
- `wordpressId`, `wordpressSlug`, `wordpressAuthor` - Migration tracking
- `metaKeywords`, `canonicalUrl` - Enhanced SEO
- `featuredImageCaption`, `customExcerpt` - Content enhancements

**Categories:**
- `wordpressId` - WordPress ID mapping
- `color`, `icon`, `order` - UI enhancements
- `parentId`, `parent`, `children` - Hierarchical support

**Users (Authors):**
- `wordpressId` - WordPress user mapping
- `socialTwitter`, `socialLinkedin`, `socialFacebook`, `website`
- `jobTitle`, `authorPageSlug`

**Pages, Videos, Podcasts:**
- All have `wordpressId` for migration tracking

### Step 5: Content API Layer Created
- ✅ Created `lib/content.ts` (WordPress replacement)
- ✅ All data fetching functions implemented:
  - `getPublishedPosts()` - With filters, pagination, search
  - `getPublishedPostsCount()` - For pagination
  - `getPostBySlug()` - Individual posts with view tracking
  - `getPostById()` - Admin/preview access
  - `getRelatedPosts()` - Related content by category
  - `getCategoryBySlug()` - Category with post count
  - `getAllCategories()` - All categories with counts
  - `getAuthorBySlug()` - Author with posts
  - `getAllAuthors()` - All authors with post counts
  - `getPageBySlug()` - Static pages
  - `getAllPages()` - All pages
  - `getAllMagazines()` - Magazine issues
  - `getMagazineBySlug()` - Individual magazine
  - `getLatestMagazine()` - Most recent issue
  - `getAllPressReleases()` - Press releases
  - `getPressReleaseBySlug()` - Individual press release
  - `getAllTags()` - All tags
  - `getTagBySlug()` - Tag with posts
  - `searchContent()` - Full-text search
  - `getTrendingPosts()` - Popular content
  - `getAllPostsForSitemap()` - SEO sitemap data
  - `getAllCategoriesForSitemap()` - Category sitemap data

**Features Implemented:**
- Smart filtering (category, author, tag, search, date range)
- Pagination support with count queries
- Auto-increment view counts
- Full-text search across posts, pages, press releases
- Trending posts by view count
- Related posts by category similarity
- Hierarchical categories
- Author fallback matching (slug → email)

---

## 📋 Next Steps (In Order)

### Step 6: WordPress Migration Script ⏳
**Files to Create:**
- `scripts/migrate-from-wordpress.ts` - Main migration script

**Tasks:**
1. Fetch all WordPress content (posts, categories, authors, pages)
2. Map WordPress category IDs to local categories
3. Create user accounts for all WordPress authors
4. Download featured images to Vercel Blob
5. Download author avatars
6. Migrate posts with all metadata
7. Map category and tag relationships
8. Migrate pages, press releases
9. Track migration in `wordpress_migration` table
10. Generate migration report

**Estimated Time:** 2-3 days

### Step 7: Admin CRUD API Routes ⏳
**Files to Create:**
- `pages/api/admin/posts/index.ts` - List/create posts
- `pages/api/admin/posts/[id].ts` - Get/update/delete post
- `pages/api/admin/posts/[id]/publish.ts` - Publish post
- `pages/api/admin/categories/index.ts` - List/create categories
- `pages/api/admin/categories/[id].ts` - Update/delete category
- `pages/api/admin/media/upload.ts` - Upload images
- `pages/api/admin/media/index.ts` - List media
- `pages/api/admin/authors/index.ts` - List authors
- `pages/api/admin/authors/[id].ts` - Update author profile
- `pages/api/admin/pages/index.ts` - List/create pages
- `pages/api/admin/pages/[id].ts` - Update/delete page

**Estimated Time:** 2-3 days

### Step 8: Update Public Pages ⏳
**Files to Update:**
- `pages/index.tsx` - Homepage (use `getPublishedPosts()`)
- `pages/blog/[slug].tsx` - Blog posts (use `getPostBySlug()`)
- `pages/category/[slug].tsx` - Category pages (use `getCategoryBySlug()`)
- `pages/author/[slug].tsx` - Author pages (use `getAuthorBySlug()`)
- `pages/bestsellers.tsx` - Popular posts (use `getTrendingPosts()`)
- `pages/magazine.tsx` - Magazine page (already uses local DB)
- `pages/magazine/archive.tsx` - Magazine archive
- `pages/press-releases.tsx` - Press releases list
- `pages/press-release/[slug].tsx` - Individual press release
- `pages/terms.tsx` - Terms page (use `getPageBySlug()`)
- `pages/privacy.tsx` - Privacy page (use `getPageBySlug()`)
- `pages/api/rss.js` - RSS feed (use `getPublishedPosts()`)
- `pages/sitemap.xml.tsx` - Sitemap (use `getAllPostsForSitemap()`)

**Estimated Time:** 3-4 days

### Step 9: Build Admin CMS ⏳
**Files to Create/Update:**
- `pages/admin/posts/index.tsx` - Posts list (make functional)
- `pages/admin/posts/new.tsx` - Create post
- `pages/admin/posts/[id]/edit.tsx` - Edit post
- `pages/admin/categories/index.tsx` - Category manager
- `pages/admin/media/index.tsx` - Media library
- `pages/admin/pages/index.tsx` - Pages list
- `pages/admin/authors/index.tsx` - Authors manager
- `pages/admin/content/index.tsx` - Content dashboard (replace wordpress-sync)
- `components/admin/PostEditor.tsx` - Rich text post editor
- `components/admin/MediaPicker.tsx` - Image picker modal
- `components/admin/CategorySelector.tsx` - Category multi-select

**Estimated Time:** 4-5 days

### Step 10: Remove WordPress Dependencies ⏳
**Files to Delete:**
- `lib/wordpress.js` - WordPress API client
- `pages/api/wordpress/sync.js` - Sync endpoint
- `pages/api/wordpress/posts.ts` - WordPress posts proxy
- `pages/api/wordpress/pages.ts` - WordPress pages proxy
- `pages/api/sync/wordpress.ts` - Alternative sync
- `pages/api/cron/daily-sync.js` - Daily cron job
- `pages/api/cron/hourly-sync.js` - Hourly sync (if exists)
- `pages/admin/wordpress-sync.tsx` - WordPress sync UI
- `pages/admin/content-viewer.tsx` - WordPress content viewer
- `components/admin/PostsListWithFilters.tsx` - (Replace with new version)

**Files to Update:**
- `.env.local` - Remove `WORDPRESS_API_URL`
- `vercel.json` - Remove cron jobs
- `next.config.js` - Remove WordPress-specific config (if any)

**Environment Variables to Remove:**
- `WORDPRESS_API_URL`
- `NEXT_PUBLIC_WORDPRESS_API_URL`
- `CRON_SECRET` (if only used for WordPress sync)

**Estimated Time:** 1-2 days

---

## 📊 Overall Progress

**Completed:** 5 / 10 major steps (50%)

**Time Spent:** ~3 days
**Time Remaining:** ~10-16 days
**Total Estimated:** 13-19 days

---

## 🎯 Success Metrics

### Migration Success Criteria
- [ ] All WordPress posts migrated (verify count matches)
- [ ] All categories mapped correctly
- [ ] All author accounts created
- [ ] All featured images downloaded and stored
- [ ] All category relationships preserved
- [ ] All tag relationships preserved

### Functional Success Criteria
- [ ] Homepage loads from local database
- [ ] Individual blog posts display correctly
- [ ] Category pages work
- [ ] Author pages work
- [ ] Search functionality works
- [ ] RSS feed generates
- [ ] Sitemap generates
- [ ] SEO metadata correct

### Admin CMS Success Criteria
- [ ] Can create new posts
- [ ] Can edit existing posts
- [ ] Can upload images
- [ ] Can assign categories
- [ ] Can create tags
- [ ] Can publish/unpublish posts
- [ ] Can create pages
- [ ] Can update author bios

### Performance Success Criteria
- [ ] Page load times maintained or improved
- [ ] No WordPress API calls (verified via network tab)
- [ ] Database queries optimized
- [ ] Images loading from Vercel Blob

### SEO Success Criteria
- [ ] All URLs remain the same
- [ ] Meta tags preserved
- [ ] Structured data correct
- [ ] Sitemap up to date
- [ ] No 404 errors
- [ ] Redirects working (if any URLs changed)

---

## 🚀 Deployment Strategy

### Testing Environment
1. Run migration on staging database first
2. Test all public pages
3. Test all admin functionality
4. Verify SEO metadata
5. Check performance

### Production Deployment
1. Schedule maintenance window (if needed)
2. Take database backup
3. Run migration script
4. Deploy updated code to Vercel
5. Verify WordPress API calls are gone
6. Monitor for errors
7. Test critical user flows

### Rollback Plan
- Keep WordPress content accessible (read-only)
- Database backup available for restore
- Feature flag to switch between WordPress and local (during transition)

---

## 📝 Files Created

### Documentation
1. `WORDPRESS_AUDIT.md` - Complete WordPress dependency audit
2. `LOCAL_CMS_DESIGN.md` - Comprehensive replacement design
3. `DECOUPLING_PROGRESS.md` - This file (progress tracker)

### Code
1. `lib/content.ts` - New content API layer (WordPress replacement)
2. `prisma/schema.prisma` - Extended with WordPress migration fields

### Database
- Extended `posts` table with WordPress tracking fields
- Extended `categories` table with hierarchy and UI fields
- Extended `users` table with social and author fields
- Extended `pages`, `videos`, `podcasts` with WordPress IDs
- Added `press_releases` table
- Added `wordpress_migration` tracking table

---

## 🔍 WordPress Category ID Mapping

These WordPress category IDs need to be mapped during migration:

```javascript
const WORDPRESS_CATEGORIES = {
  Business: 4,
  Lifestyle: 14056,
  Money: 14060,
  "Future of Work": 14061,
  "Health & Wellness": 14059,
  "AI & Technology": 14681,
  Entertainment: 14382
};
```

---

## 💡 Key Decisions Made

1. **Database-First Approach** - Using existing PostgreSQL + Prisma instead of external CMS
2. **Gradual Migration** - Can migrate content types incrementally if needed
3. **WordPress ID Tracking** - Keep `wordpressId` fields for mapping and potential rollback
4. **Vercel Blob for Images** - Same as magazines, CDN-backed storage
5. **View Tracking** - Auto-increment views on each post read
6. **Hierarchical Categories** - Support parent/child category relationships
7. **Author Slug Flexibility** - Try `authorPageSlug` first, fallback to email-based slug

---

## ⚠️ Important Notes

- **Do NOT delete WordPress content** during migration - keep as backup
- **Test thoroughly** on staging before production
- **Take database snapshots** before major steps
- **Keep lib/wordpress.js** until all pages converted
- **Monitor performance** after switching to local database
- **Update environment variables** in Vercel dashboard

---

## 🔗 Related Files

- Audit Report: `WORDPRESS_AUDIT.md`
- Design Document: `LOCAL_CMS_DESIGN.md`
- Progress Tracker: `DECOUPLING_PROGRESS.md` (this file)
- Content API: `lib/content.ts`
- Database Schema: `prisma/schema.prisma`

---

**Next Action:** Create WordPress migration script (`scripts/migrate-from-wordpress.ts`)

---

*Last updated: 2025-11-20 after completing content API layer*
