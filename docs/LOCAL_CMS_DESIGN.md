# Local CMS Design Document

**Project:** SUCCESS Next.js - WordPress Decoupling
**Date:** 2025-11-20
**Status:** Design Phase

---

## Overview

This document outlines the complete design for replacing WordPress as the content source with a local database-driven CMS. The new system will use the existing PostgreSQL database with extended Prisma schema.

---

## Architecture Decision

### Selected Approach: **Database-First with Prisma + Admin UI**

**Why this approach:**
- ✅ Already have PostgreSQL database and Prisma configured
- ✅ Existing tables for posts, categories, tags, users (authors)
- ✅ Better performance (no external API calls)
- ✅ Full control over data structure
- ✅ Built-in relationships and data integrity
- ✅ Can build custom admin UI tailored to needs
- ✅ Supports rich media storage via Vercel Blob

**Rejected alternatives:**
- ❌ JSON files - Not scalable, hard to query, no relationships
- ❌ Third-party CMS (Sanity/Contentful) - Migration complexity, ongoing costs, vendor lock-in

---

## Database Schema Extensions

### Current State Analysis

**✅ Already Have (No Changes Needed):**
```prisma
model posts {
  id               String
  title            String
  slug             String          @unique
  content          String
  excerpt          String?
  featuredImage    String?
  featuredImageAlt String?
  status           PostStatus
  authorId         String
  publishedAt      DateTime?
  createdAt        DateTime
  updatedAt        DateTime
  seoTitle         String?
  seoDescription   String?
  readTime         Int?
  views            Int
  users            users           @relation(...)
  categories       categories[]    @relation("PostCategories")
  tags             tags[]          @relation("PostTags")
  post_revisions   post_revisions[]
}

model categories {
  id          String
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime
  updatedAt   DateTime
  posts       posts[]  @relation("PostCategories")
}

model tags {
  id        String
  name      String
  slug      String   @unique
  createdAt DateTime
  updatedAt DateTime
  posts     posts[]  @relation("PostTags")
}

model users {
  id       String
  name     String
  email    String   @unique
  bio      String?
  avatar   String?
  role     UserRole
  posts    posts[]
  // ... more fields
}

model pages {
  id             String
  title          String
  slug           String     @unique
  content        String
  status         PostStatus
  publishedAt    DateTime?
  createdAt      DateTime
  updatedAt      DateTime
  seoTitle       String?
  seoDescription String?
}

model videos {
  id          String
  title       String
  slug        String     @unique
  description String?
  videoUrl    String
  thumbnail   String?
  duration    Int?
  status      PostStatus
  publishedAt DateTime?
  createdAt   DateTime
  updatedAt   DateTime
}

model podcasts {
  id          String
  title       String
  slug        String     @unique
  description String?
  audioUrl    String
  thumbnail   String?
  duration    Int?
  status      PostStatus
  publishedAt DateTime?
  createdAt   DateTime
  updatedAt   DateTime
}

model magazines {
  id            String
  title         String
  slug          String   @unique
  publishedText String
  description   String?
  pdfUrl        String
  coverImageUrl String?
  fileSize      Int
  createdAt     DateTime
  updatedAt     DateTime
}

model media {
  id         String
  filename   String
  url        String
  mimeType   String
  size       Int
  width      Int?
  height     Int?
  alt        String?
  uploadedBy String
  createdAt  DateTime
  caption    String?
}
```

**✨ New Fields to Add:**

```prisma
model posts {
  // ... existing fields

  // WordPress migration tracking
  wordpressId      Int?    // Original WordPress post ID
  wordpressSlug    String? // Original WP slug (for URL redirects)
  wordpressAuthor  String? // Original WP author name if not matched

  // Enhanced metadata
  metaKeywords     String?
  canonicalUrl     String?

  // Content enhancements
  featuredImageCaption String?
  customExcerpt    Boolean @default(false) // True if excerpt is manually written

  @@index([wordpressId])
}

model categories {
  // ... existing fields

  // WordPress migration
  wordpressId Int? @unique

  // Enhanced fields
  color       String? // Category color for UI
  icon        String? // Icon name or emoji
  order       Int     @default(0) // Display order
  parentId    String? // For hierarchical categories
  parent      categories? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    categories[] @relation("CategoryHierarchy")

  // WordPress category IDs from homepage
  // Business: 4, Lifestyle: 14056, Money: 14060, etc.

  @@index([wordpressId])
  @@index([order])
}

model users {
  // ... existing fields

  // Author enhancements
  wordpressId      Int?    @unique
  socialTwitter    String?
  socialLinkedin   String?
  socialFacebook   String?
  website          String?
  jobTitle         String?
  authorPageSlug   String? @unique // Custom author page URL

  @@index([wordpressId])
}

model pages {
  // ... existing fields

  wordpressId      Int?    @unique
  template         String? // Page template (default, full-width, etc.)
  parentId         String? // For page hierarchy
  order            Int     @default(0)

  @@index([wordpressId])
}

// New model for press releases (currently in WordPress)
model press_releases {
  id               String     @id @default(uuid())
  title            String
  slug             String     @unique
  content          String
  excerpt          String?
  featuredImage    String?
  status           PostStatus @default(DRAFT)
  publishedAt      DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  seoTitle         String?
  seoDescription   String?
  wordpressId      Int?       @unique

  @@index([slug])
  @@index([publishedAt])
  @@index([wordpressId])
}

// Migration tracking
model wordpress_migration {
  id               String   @id @default(uuid())
  contentType      String   // 'post', 'category', 'user', 'page'
  wordpressId      Int
  localId          String
  migratedAt       DateTime @default(now())
  status           String   @default("completed") // completed, failed, skipped
  errorMessage     String?

  @@unique([contentType, wordpressId])
  @@index([contentType])
}
```

---

## Data Migration Strategy

### Phase 1: WordPress Content Export

**Script:** `scripts/migrate-from-wordpress.ts`

```typescript
// Pseudo-code structure
async function migrateFromWordPress() {
  // 1. Fetch all WordPress content
  const wpPosts = await fetchAllWPPosts()
  const wpCategories = await fetchAllWPCategories()
  const wpAuthors = await fetchAllWPAuthors()
  const wpPages = await fetchAllWPPages()

  // 2. Migrate categories first (no dependencies)
  for (const wpCat of wpCategories) {
    await prisma.categories.upsert({
      where: { wordpressId: wpCat.id },
      update: { ...mapCategory(wpCat) },
      create: { ...mapCategory(wpCat) }
    })
  }

  // 3. Migrate authors
  for (const wpAuthor of wpAuthors) {
    await prisma.users.upsert({
      where: { wordpressId: wpAuthor.id },
      update: { ...mapAuthor(wpAuthor) },
      create: { ...mapAuthor(wpAuthor) }
    })
  }

  // 4. Migrate posts
  for (const wpPost of wpPosts) {
    // Download featured image to Vercel Blob
    const featuredImageUrl = await downloadAndStoreImage(wpPost.featuredMedia)

    await prisma.posts.create({
      data: {
        wordpressId: wpPost.id,
        title: wpPost.title.rendered,
        slug: wpPost.slug,
        content: wpPost.content.rendered,
        excerpt: wpPost.excerpt.rendered,
        featuredImage: featuredImageUrl,
        publishedAt: wpPost.date,
        authorId: findAuthorByWPId(wpPost.author),
        categories: {
          connect: wpPost.categories.map(catId => ({
            wordpressId: catId
          }))
        }
      }
    })
  }

  // 5. Migrate pages, videos, podcasts similarly
}
```

**Migration Checklist:**
- [ ] Categories (map WordPress IDs to local IDs)
- [ ] Authors (create user accounts for WP authors)
- [ ] Posts (download images, map relationships)
- [ ] Pages (static content)
- [ ] Videos (if keeping this content type)
- [ ] Podcasts (if keeping this content type)
- [ ] Press Releases
- [ ] Featured images (download to Vercel Blob)
- [ ] Author avatars
- [ ] Category relationships
- [ ] Tag relationships

**Image Storage Strategy:**
1. Download all WordPress images during migration
2. Store in Vercel Blob Storage (same as magazines)
3. Update URLs in database to Blob URLs
4. Maintain original URLs in metadata for verification

---

## New API Routes

### Content API (Replacement for lib/wordpress.js)

**File:** `lib/content.ts` (replaces lib/wordpress.js)

```typescript
import { prisma } from './prisma'

export async function getPublishedPosts(options: {
  categoryId?: string
  authorId?: string
  limit?: number
  offset?: number
  orderBy?: 'publishedAt' | 'views' | 'createdAt'
}) {
  return await prisma.posts.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      ...(options.categoryId && {
        categories: {
          some: { id: options.categoryId }
        }
      }),
      ...(options.authorId && { authorId: options.authorId })
    },
    include: {
      users: true, // Author
      categories: true,
      tags: true
    },
    orderBy: {
      [options.orderBy || 'publishedAt']: 'desc'
    },
    take: options.limit || 10,
    skip: options.offset || 0
  })
}

export async function getPostBySlug(slug: string) {
  return await prisma.posts.findUnique({
    where: { slug },
    include: {
      users: true,
      categories: true,
      tags: true
    }
  })
}

export async function getCategoryBySlug(slug: string) {
  return await prisma.categories.findUnique({
    where: { slug },
    include: {
      posts: {
        where: {
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() }
        },
        include: {
          users: true,
          categories: true
        },
        take: 12,
        orderBy: { publishedAt: 'desc' }
      }
    }
  })
}

export async function getAuthorBySlug(slug: string) {
  // Use authorPageSlug or email slug
  return await prisma.users.findFirst({
    where: {
      OR: [
        { authorPageSlug: slug },
        { email: { contains: slug } }
      ]
    },
    include: {
      posts: {
        where: {
          status: 'PUBLISHED'
        },
        orderBy: { publishedAt: 'desc' },
        take: 20
      }
    }
  })
}

export async function getRelatedPosts(postId: string, categoryIds: string[], limit = 3) {
  return await prisma.posts.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: postId },
      categories: {
        some: {
          id: { in: categoryIds }
        }
      }
    },
    include: {
      users: true,
      categories: true
    },
    take: limit,
    orderBy: { publishedAt: 'desc' }
  })
}
```

### Admin CRUD API Routes

**Posts Management:**
- `POST /api/admin/posts` - Create new post
- `GET /api/admin/posts` - List all posts (with filters)
- `GET /api/admin/posts/[id]` - Get single post
- `PATCH /api/admin/posts/[id]` - Update post
- `DELETE /api/admin/posts/[id]` - Delete post
- `POST /api/admin/posts/[id]/publish` - Publish draft
- `POST /api/admin/posts/[id]/duplicate` - Duplicate post

**Categories Management:**
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories` - List all categories
- `PATCH /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category (must be empty)

**Media Management:**
- `POST /api/admin/media/upload` - Upload image to Vercel Blob
- `GET /api/admin/media` - List media library
- `DELETE /api/admin/media/[id]` - Delete media

**Authors Management:**
- `GET /api/admin/authors` - List all authors
- `PATCH /api/admin/authors/[id]` - Update author profile

**Pages Management:**
- `POST /api/admin/pages` - Create page
- `GET /api/admin/pages` - List pages
- `PATCH /api/admin/pages/[id]` - Update page
- `DELETE /api/admin/pages/[id]` - Delete page

---

## Admin UI Design

### New Admin Pages

**1. Posts Manager (Enhanced)**
- **Path:** `/admin/posts`
- **Replaces:** WordPress sync dashboard
- **Features:**
  - Full post list with filters (status, category, author, date)
  - Search by title/content
  - Bulk actions (publish, draft, delete)
  - Quick edit inline
  - Advanced filters (has featured image, has excerpt, view count)
  - Export to CSV
  - **NEW:** Actually saves to local database (not read-only)

**2. Post Editor**
- **Path:** `/admin/posts/new` and `/admin/posts/[id]/edit`
- **Replaces:** Current EnhancedPostEditor (make it functional)
- **Features:**
  - Rich text editor (TipTap or similar)
  - Featured image uploader
  - SEO metadata fields
  - Category selection (multi-select)
  - Tag input (create on-the-fly)
  - Excerpt editor
  - Publish settings (status, publish date, author)
  - Preview mode
  - Auto-save drafts
  - Revision history

**3. Category Manager**
- **Path:** `/admin/categories`
- **Features:**
  - Create/edit/delete categories
  - Assign colors and icons
  - Reorder categories (drag & drop)
  - View post counts per category
  - Hierarchical categories (parent/child)

**4. Media Library**
- **Path:** `/admin/media`
- **Features:**
  - Upload images
  - View all uploaded media
  - Search/filter media
  - Image details (size, dimensions, URL)
  - Delete unused media
  - Select image for posts (modal picker)

**5. Pages Manager**
- **Path:** `/admin/pages`
- **Features:**
  - Similar to posts but for static pages
  - Page templates selection
  - Page hierarchy

**6. Content Overview Dashboard**
- **Path:** `/admin/content`
- **Replaces:** WordPress sync dashboard
- **Features:**
  - Content statistics (total posts, published, drafts)
  - Recent activity feed
  - Quick links to create content
  - Popular posts by views
  - Categories breakdown
  - **NO MORE WordPress sync buttons**

**7. Authors Manager**
- **Path:** `/admin/authors`
- **Features:**
  - List all authors
  - Edit author bios
  - View posts by author
  - Social links management

---

## Public Page Updates

### Files to Update

**1. pages/index.tsx (Homepage)**
```typescript
// BEFORE
import { fetchWordPressData } from '../lib/wordpress'

export async function getStaticProps() {
  const businessPosts = await fetchWordPressData('posts?categories=4&_embed&per_page=3')
  // ...
}

// AFTER
import { getPublishedPosts } from '../lib/content'

export async function getStaticProps() {
  const businessCategory = await prisma.categories.findUnique({
    where: { wordpressId: 4 } // or slug: 'business'
  })

  const businessPosts = await getPublishedPosts({
    categoryId: businessCategory.id,
    limit: 3
  })
  // ...
}
```

**2. pages/blog/[slug].tsx**
```typescript
// BEFORE
import { fetchWordPressData } from '../../lib/wordpress'

export async function getServerSideProps({ params }) {
  const posts = await fetchWordPressData(`posts?slug=${params.slug}&_embed`)
  // ...
}

// AFTER
import { getPostBySlug, getRelatedPosts } from '../../lib/content'

export async function getServerSideProps({ params }) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return { notFound: true }
  }

  const categoryIds = post.categories.map(c => c.id)
  const relatedPosts = await getRelatedPosts(post.id, categoryIds, 3)

  return {
    props: {
      post: JSON.parse(JSON.stringify(post)),
      relatedPosts: JSON.parse(JSON.stringify(relatedPosts))
    }
  }
}
```

**3. pages/category/[slug].tsx**
```typescript
// BEFORE
const categories = await fetchWordPressData(`categories?slug=${slug}`)
const posts = await fetchWordPressData(`posts?categories=${category.id}&_embed&per_page=12`)

// AFTER
const category = await getCategoryBySlug(slug)
// Posts already included via Prisma include
```

**4. pages/sitemap.xml.tsx**
```typescript
// BEFORE
const posts = await fetchWordPressData('posts?per_page=1000')

// AFTER
const posts = await prisma.posts.findMany({
  where: { status: 'PUBLISHED' },
  select: { slug: true, updatedAt: true }
})
```

**5. pages/api/rss.js**
```typescript
// BEFORE
const posts = await fetchWordPressData('posts?_embed&per_page=50')

// AFTER
const posts = await getPublishedPosts({ limit: 50 })
```

---

## Data Mapping

### WordPress to Local Field Mapping

```javascript
// WordPress Post → Local Post
{
  id: wp.id,                              // → wordpressId (for tracking)
  title: { rendered: "..." },             // → title (strip HTML entities)
  slug: "...",                            // → slug
  content: { rendered: "..." },           // → content
  excerpt: { rendered: "..." },           // → excerpt
  date: "2024-01-01T00:00:00",           // → publishedAt
  modified: "2024-01-02T00:00:00",       // → updatedAt
  status: "publish",                      // → status: "PUBLISHED"
  author: 123,                            // → authorId (map WP user ID)
  categories: [4, 14056],                 // → categories (connect by wordpressId)
  tags: [10, 20],                         // → tags (connect)
  _embedded: {
    "wp:featuredmedia": [{
      source_url: "...",                  // → featuredImage (download & store)
      alt_text: "..."                     // → featuredImageAlt
    }],
    author: [{
      name: "...",                        // → users.name
      avatar_urls: { "96": "..." }       // → users.avatar (download)
    }]
  }
}

// WordPress Category → Local Category
{
  id: 4,                                  // → wordpressId
  name: "Business",                       // → name
  slug: "business",                       // → slug
  description: "...",                     // → description
  count: 150                              // Not stored, calculated from posts
}
```

---

## URL Structure & Redirects

### Maintain Existing URLs

```
# Public URLs (NO CHANGES)
/                           → Homepage
/blog/[slug]               → Post detail
/category/[slug]           → Category archive
/author/[slug]             → Author archive
/magazine                  → Magazine page
/store                     → Store page
/api/rss                   → RSS feed
/api/sitemap.xml           → Sitemap

# Admin URLs (NEW)
/admin/posts               → Posts list
/admin/posts/new           → Create post
/admin/posts/[id]/edit     → Edit post
/admin/categories          → Categories
/admin/media               → Media library
/admin/pages               → Pages list
/admin/authors             → Authors
/admin/content             → Content dashboard (replaces wordpress-sync)
```

### URL Redirects (Optional)

Create `url_redirects` table entries for any changed WordPress URLs:

```typescript
// If WordPress slug differs from new slug
await prisma.url_redirects.create({
  data: {
    oldUrl: '/old-wordpress-slug',
    newUrl: '/new-local-slug',
    statusCode: 301,
    isActive: true
  }
})
```

---

## Performance Optimization

### Caching Strategy

**1. Static Site Generation (SSG) with ISR**
- Homepage: Revalidate every 600s (10 min)
- Category pages: Revalidate every 600s
- Individual posts: On-demand ISR (no time-based revalidation)

**2. Database Indexing**
```prisma
@@index([slug])
@@index([status])
@@index([publishedAt])
@@index([wordpressId])
```

**3. Query Optimization**
- Use Prisma `include` instead of separate queries
- Implement pagination for large lists
- Use `select` to fetch only needed fields

**4. Image Optimization**
- Store images in Vercel Blob (CDN-backed)
- Use Next.js Image component for automatic optimization
- Lazy load images below the fold

---

## Migration Timeline

### Phase 1: Database Setup (1-2 days)
- [ ] Add new fields to Prisma schema
- [ ] Create migration: `npx prisma migrate dev --name add_wordpress_fields`
- [ ] Test database changes

### Phase 2: Content Migration (2-3 days)
- [ ] Write migration script `scripts/migrate-from-wordpress.ts`
- [ ] Test migration on sample data (10 posts)
- [ ] Run full migration (all content)
- [ ] Verify data integrity
- [ ] Download and store all images

### Phase 3: API Layer (2-3 days)
- [ ] Create `lib/content.ts` with all data fetching functions
- [ ] Create admin API routes (CRUD)
- [ ] Test API endpoints
- [ ] Add authentication/authorization

### Phase 4: Public Pages Update (3-4 days)
- [ ] Update homepage to use local data
- [ ] Update blog post pages
- [ ] Update category pages
- [ ] Update author pages
- [ ] Update sitemap
- [ ] Update RSS feed
- [ ] Test all pages

### Phase 5: Admin UI (4-5 days)
- [ ] Build post editor
- [ ] Build posts list manager
- [ ] Build category manager
- [ ] Build media library
- [ ] Build pages manager
- [ ] Build content dashboard
- [ ] Test admin workflows

### Phase 6: Cleanup (1-2 days)
- [ ] Delete `lib/wordpress.js`
- [ ] Delete `/api/wordpress/*` routes
- [ ] Delete `/api/cron/daily-sync.js`
- [ ] Delete WordPress sync admin pages
- [ ] Remove WordPress environment variables
- [ ] Remove cron jobs from vercel.json
- [ ] Update documentation
- [ ] Final testing

**Total Estimated Time: 13-19 days**

---

## Testing Plan

### Migration Testing
- [ ] Verify all posts migrated correctly
- [ ] Verify all categories mapped
- [ ] Verify all author accounts created
- [ ] Verify featured images downloaded
- [ ] Compare WordPress post count vs local DB count
- [ ] Spot-check 20 random posts for accuracy

### Functional Testing
- [ ] Create new post via admin
- [ ] Edit existing post
- [ ] Upload image to media library
- [ ] Assign categories to post
- [ ] Publish draft post
- [ ] Delete post
- [ ] Create category
- [ ] Update author bio

### Public Site Testing
- [ ] Homepage loads with correct posts
- [ ] Category pages show correct posts
- [ ] Individual blog posts display correctly
- [ ] Related posts work
- [ ] Author pages work
- [ ] Sitemap generates correctly
- [ ] RSS feed works
- [ ] SEO metadata correct

---

## Rollback Plan

### If Migration Fails

**Option 1: Keep WordPress Temporarily**
- Keep `lib/wordpress.js` in place
- Add feature flag to switch between WordPress and local data
- Gradually migrate content types (posts first, then categories, etc.)

**Option 2: Database Snapshot**
- Take database backup before migration
- If issues arise, restore backup
- Fix migration script and retry

**Safety Measures:**
- Never delete WordPress content during migration
- Keep WordPress API as read-only fallback
- Test thoroughly on staging environment first

---

## Success Criteria

✅ **Migration Complete When:**
1. All WordPress content copied to local database
2. All public pages load from local database (not WordPress)
3. Admin can create/edit/delete content via admin UI
4. All WordPress API routes deleted
5. No WordPress environment variables in use
6. Cron jobs removed
7. Site performance maintained or improved
8. SEO rankings unchanged
9. Zero downtime during migration

---

## Next Steps

1. ✅ Design complete
2. ⏳ Extend Prisma schema
3. ⏳ Create migration script
4. ⏳ Run test migration
5. ⏳ Build content API layer
6. ⏳ Update public pages
7. ⏳ Build admin UI
8. ⏳ Remove WordPress dependencies

---

**End of Design Document**
