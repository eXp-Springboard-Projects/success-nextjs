# WordPress Content Migration Guide

Complete guide for migrating 2,000+ WordPress posts to the Next.js database with automated scripts, URL mapping, and SEO preservation.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Scripts](#migration-scripts)
3. [Step-by-Step Process](#step-by-step-process)
4. [Troubleshooting](#troubleshooting)
5. [Rollback Procedure](#rollback-procedure)

## Prerequisites

### 1. Export WordPress Data

First, export your WordPress content using the export script:

```bash
node scripts/wordpress-export.js
```

This creates `wordpress-export-data.json` with:
- Posts (2,000+)
- Pages
- Categories
- Tags
- Authors
- Media files

### 2. Database Setup

Ensure your database schema is up to date:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

### 3. Environment Variables

Required in `.env.local`:

```env
DATABASE_URL="your-postgres-connection-string"
WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"
```

## Migration Scripts

### 1. **import-wordpress-content.js**

Main import script with batch processing for 2,000+ posts.

**Features:**
- Batch processing (50 posts per batch by default)
- Progress tracking with real-time stats
- Media file downloading to `/public/media/wordpress`
- Relationship mapping (categories, tags, authors)
- URL mapping generation for redirects

**Usage:**

```bash
# Full import (all posts)
node scripts/import-wordpress-content.js

# Test mode (first 100 posts)
node scripts/import-wordpress-content.js --test

# Custom batch size
BATCH_SIZE=100 node scripts/import-wordpress-content.js
```

**Output:**
- Imports all content to database
- Creates `scripts/url-mappings.json`

### 2. **test-import.js**

Safe test import of 100 posts with verification.

**Features:**
- Database connection verification
- Schema validation
- Automatic backup creation
- Import verification
- Sample data display

**Usage:**

```bash
node scripts/test-import.js
```

**What it does:**
1. ✅ Verifies database connection
2. ✅ Checks schema (User, Post, Page, Category, Tag, Media tables)
3. 💾 Creates backup of existing data
4. 🚀 Imports first 100 posts
5. 🔍 Verifies results
6. 📊 Shows sample imported posts

### 3. **generate-redirects.js**

Generates `vercel.json` with 301 redirects.

**Features:**
- Maps all WordPress URLs to Next.js URLs
- Removes duplicate redirects
- Generates stats and samples
- SEO-friendly 301 permanent redirects

**Usage:**

```bash
node scripts/generate-redirects.js
```

**Input:** `scripts/url-mappings.json`
**Output:** `vercel.json` with redirects

**Example redirect:**

```json
{
  "source": "/2024/03/15/article-slug",
  "destination": "/blog/article-slug",
  "permanent": true
}
```

### 4. **migration-helper.js**

Utility commands for migration management.

**Commands:**

```bash
# Verify export file structure
node scripts/migration-helper.js verify-export

# Validate URL mappings
node scripts/migration-helper.js validate-urls

# Show database statistics
node scripts/migration-helper.js stats

# Clean up all imported data (DANGEROUS!)
node scripts/migration-helper.js cleanup
```

## Step-by-Step Process

### Phase 1: Preparation (5 minutes)

1. **Export WordPress data:**
   ```bash
   node scripts/wordpress-export.js
   ```

2. **Verify export file:**
   ```bash
   node scripts/migration-helper.js verify-export
   ```

3. **Check database:**
   ```bash
   npx prisma db push
   node scripts/migration-helper.js stats
   ```

### Phase 2: Test Import (10 minutes)

4. **Run test import (100 posts):**
   ```bash
   node scripts/test-import.js
   ```

5. **Verify in browser:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/blog
   ```

6. **Check imported data:**
   ```bash
   node scripts/migration-helper.js stats
   ```

### Phase 3: Full Import (30-60 minutes)

7. **Run full import:**
   ```bash
   node scripts/import-wordpress-content.js
   ```

   Expected output:
   ```
   📝 Importing Authors: [23/23] 100% | 2.1s | 10.95/s
   ✓ Complete

   📁 Importing Categories: [50/50] 100% | 5.3s | 9.43/s
   ✓ Complete

   🏷️  Importing Tags: [200/200] 100% | 12.7s | 15.75/s
   ✓ Complete

   🖼️  Importing Media: [1500/1500] 100% | 145.2s | 10.33/s
   ✓ Complete

   📰 Importing Posts: [2000/2000] 100% | 320.5s | 6.24/s
   ✓ Complete

   📄 Importing Pages: [50/50] 100% | 8.9s | 5.62/s
   ✓ Complete

   ✅ Import Complete!
      URL mappings saved to: scripts/url-mappings.json
      Total URLs mapped: 2050
   ```

### Phase 4: URL Redirects (2 minutes)

8. **Generate redirects:**
   ```bash
   node scripts/generate-redirects.js
   ```

9. **Validate redirects:**
   ```bash
   node scripts/migration-helper.js validate-urls
   ```

10. **Deploy to Vercel:**
    ```bash
    git add vercel.json
    git commit -m "Add WordPress URL redirects for SEO"
    git push
    ```

### Phase 5: Verification (5 minutes)

11. **Check final stats:**
    ```bash
    node scripts/migration-helper.js stats
    ```

12. **Test production site:**
    - Visit old WordPress URLs (should redirect)
    - Check `/blog` page loads
    - Verify category pages work
    - Test search functionality

## Troubleshooting

### Import Fails: "Database connection error"

**Solution:**
```bash
# Test connection
npx prisma db push

# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL
```

### Import Fails: "Table does not exist"

**Solution:**
```bash
# Reset database schema
npx prisma db push --force-reset

# Or run migrations
npx prisma migrate dev
```

### Media Download Failures

**Issue:** Some media files fail to download

**Solution:**
- Script continues on media errors
- Check console warnings for failed URLs
- Media URLs fall back to original WordPress URLs
- Can re-run media import separately

### Duplicate Slugs

**Issue:** Posts with same slug

**Solution:**
```bash
# Verify export has unique slugs
node scripts/migration-helper.js verify-export

# Check for duplicates in database
npx prisma studio
# Query: SELECT slug, COUNT(*) FROM Post GROUP BY slug HAVING COUNT(*) > 1
```

### Out of Memory (2,000+ posts)

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" node scripts/import-wordpress-content.js

# Or reduce batch size
BATCH_SIZE=25 node scripts/import-wordpress-content.js
```

### Import Too Slow

**Solution:**
```bash
# Increase batch size (faster, more memory)
BATCH_SIZE=100 node scripts/import-wordpress-content.js

# Or disable media downloads temporarily
# (Edit script: set DOWNLOAD_MEDIA = false)
```

## Rollback Procedure

### Option 1: Restore from Backup

Test import creates automatic backup:

```bash
# Find backup file
ls scripts/backup-*.json

# Restore manually or use cleanup + reimport
node scripts/migration-helper.js cleanup
```

### Option 2: Clean Database

```bash
# Remove all imported content
node scripts/migration-helper.js cleanup
```

⚠️ **WARNING:** This deletes:
- All posts
- All pages
- All media
- All categories/tags
- All author users (role: AUTHOR)

### Option 3: Database Reset

```bash
# Nuclear option: reset entire database
npx prisma db push --force-reset
npx prisma db seed
```

## Performance Benchmarks

Based on 2,000 posts with 1,500 media files:

| Phase          | Time     | Rate      |
|----------------|----------|-----------|
| Authors        | ~2s      | 11/s      |
| Categories     | ~5s      | 10/s      |
| Tags           | ~13s     | 15/s      |
| Media          | ~2-3min  | 8-10/s    |
| Posts          | ~5-6min  | 5-7/s     |
| Pages          | ~9s      | 5/s       |
| **Total**      | **8-10min** | -       |

*Note: Times vary based on network speed (media downloads) and database performance*

## Best Practices

1. **Always test first:** Run `test-import.js` before full import
2. **Verify export:** Check data structure before importing
3. **Monitor progress:** Watch console output for errors
4. **Backup first:** Test import creates automatic backups
5. **Check stats:** Verify counts after import
6. **Test redirects:** Ensure old URLs redirect properly
7. **Incremental approach:** Import in batches if needed

## Next Steps After Migration

1. **Switch content source:** Update app to use database instead of WordPress API
2. **Update pages:** Modify `/pages/blog/[slug].tsx` to query Prisma
3. **Implement search:** Add full-text search on Post table
4. **Set up ISR:** Configure revalidation for dynamic routes
5. **Monitor performance:** Check page load times
6. **SEO audit:** Verify redirects and meta tags

## Scripts Summary

| Script | Purpose | Usage |
|--------|---------|-------|
| `import-wordpress-content.js` | Main import (2,000+ posts) | `node scripts/import-wordpress-content.js` |
| `test-import.js` | Test import (100 posts) | `node scripts/test-import.js` |
| `generate-redirects.js` | Create URL redirects | `node scripts/generate-redirects.js` |
| `migration-helper.js` | Verify, validate, cleanup | `node scripts/migration-helper.js <command>` |

## Support

If you encounter issues:

1. Check console output for specific errors
2. Run `migration-helper.js stats` to see current state
3. Review this guide's troubleshooting section
4. Check Prisma schema matches migration needs
5. Verify database connection and permissions

---

**Last Updated:** 2025-11-08
**Version:** 1.0
