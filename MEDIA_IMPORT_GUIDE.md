# WordPress Media Import Guide

Complete system for scraping and importing all media from WordPress REST API into your local media library.

## Features

✅ **Scrape entire WordPress site** - Fetches all media items from WordPress REST API
✅ **Bulk batch processing** - Import multiple pages in parallel for 5-10x speed improvement
✅ **Progress tracking** - Real-time progress bar, stats, and detailed logging
✅ **Duplicate detection** - Automatically skips media that already exists
✅ **Error handling** - Graceful error handling with detailed error logs
✅ **Dry run mode** - Preview what will be imported before running
✅ **Resumable imports** - Stop and resume at any time

## Quick Start

### 1. Prepare Database

Run the migration script to add WordPress-specific fields to the media table:

```bash
DATABASE_URL="your-db-url" npx tsx scripts/add-wordpress-media-fields.ts
```

This adds:
- `wordpressId` - WordPress media ID (unique)
- `metadata` - JSON field for WordPress metadata
- `uploadedBy` - Track who imported the media
- Indexes for better query performance

### 2. Access Import Tool

Navigate to: `/admin/media/import`

Or add to your admin navigation menu.

### 3. Run Dry Run (Optional)

1. Click "Run Dry Run" to preview:
   - Total number of media items
   - Number of pages
   - Sample of first few items

### 4. Configure Import

**Items per page**: 100 (recommended, WordPress API limit)
**Use bulk import**: ✓ Enabled (5-10x faster)
**Batch size**: 5 pages (processes 500 items per request)
**Auto-process**: ✓ Enabled (processes all pages automatically)

### 5. Start Import

Click "Start Full Import" and monitor progress!

## Import Modes

### 🚀 Bulk Import (Recommended)
- **Speed**: 5-10x faster than page-by-page
- **How it works**: Processes multiple pages in a single request
- **Best for**: Initial full site import
- **Batch size**: 5 pages = 500 items per request (with perPage=100)

### 📄 Page-by-Page Import
- **Speed**: Slower but more granular
- **How it works**: One API request per page
- **Best for**: Incremental updates or debugging
- **When to use**: If bulk import fails or for more detailed logging

## Performance Benchmarks

Assuming 2,000 media items on WordPress site:

| Mode | Items/Request | Total Requests | Estimated Time |
|------|---------------|----------------|----------------|
| **Page-by-page** | 100 | 20 | ~60 seconds |
| **Bulk (5 pages)** | 500 | 4 | ~12 seconds |
| **Bulk (10 pages)** | 1000 | 2 | ~8 seconds |

*Times include API calls, database inserts, and small delays between batches*

## How It Works

### Architecture

```
WordPress API → API Endpoint → Database
                     ↓
              Progress Updates → UI
```

### Process Flow

1. **Fetch** - WordPress API returns media items with metadata
2. **Check** - Query database for existing items by `wordpressId` or `url`
3. **Skip** - Items that exist are skipped (counted in stats)
4. **Transform** - WordPress data mapped to your media schema
5. **Batch Insert** - All new items inserted in single query
6. **Update** - UI updated with progress and stats

### Duplicate Detection

Media is considered duplicate if either matches:
- WordPress ID (`wordpressId`)
- Source URL (`url`)

Duplicates are automatically skipped and counted in "Skipped" stat.

## API Endpoints

### 1. `/api/admin/media/scrape-wordpress` (Single Page)

**Method**: POST

**Body**:
```json
{
  "page": 1,
  "perPage": 100,
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "page": 1,
    "totalPages": 20,
    "total": 2000,
    "processed": 100,
    "imported": 95,
    "skipped": 5,
    "errors": 0
  },
  "imported": [...],
  "skipped": [...],
  "errors": [],
  "hasMore": true
}
```

### 2. `/api/admin/media/bulk-import` (Batch)

**Method**: POST

**Body**:
```json
{
  "startPage": 1,
  "batchSize": 5,
  "perPage": 100
}
```

**Response**:
```json
{
  "success": true,
  "pagesProcessed": 5,
  "totalImported": 475,
  "totalSkipped": 25,
  "totalErrors": 0,
  "totalAvailable": 2000,
  "totalPages": 20,
  "hasMore": true,
  "nextPage": 6,
  "details": [...]
}
```

## Database Schema

### Media Table

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "wordpressId" INTEGER UNIQUE,           -- WordPress media ID
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  "mimeType" TEXT,
  size INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  caption TEXT,
  metadata JSONB,                         -- WordPress metadata
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "uploadedBy" TEXT
);

-- Indexes for performance
CREATE INDEX idx_media_wordpress_id ON media("wordpressId");
CREATE INDEX idx_media_url ON media(url);
CREATE INDEX idx_media_created_at ON media("createdAt" DESC);
CREATE INDEX idx_media_mime_type ON media("mimeType");
```

### Metadata Structure

```json
{
  "wpId": 12345,
  "wpSlug": "image-name",
  "wpAuthor": 1,
  "wpDate": "2024-01-15T10:30:00",
  "mediaType": "image",
  "mediaDetails": {
    "width": 1920,
    "height": 1080,
    "file": "2024/01/image.jpg",
    "sizes": {
      "thumbnail": {...},
      "medium": {...},
      "large": {...}
    }
  }
}
```

## Troubleshooting

### Import fails immediately

**Issue**: WordPress API URL not configured or blocked

**The scraper automatically tries multiple endpoints:**
1. `https://successcom.wpenginepowered.com/wp-json/wp/v2` (staging - recommended)
2. `https://www.success.com/wp-json/wp/v2` (production - may be blocked)
3. Environment variables if set

**Fix (optional)**: Force a specific endpoint in `.env.local`:
```bash
# Use staging API (recommended, faster, no firewall)
WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2

# Or use production (may have firewall restrictions)
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
```

**Note**: The staging API (`successcom.wpenginepowered.com`) is recommended as it has the same content but no firewall restrictions.

### "wordpressId" column not found

**Issue**: Database not migrated
**Fix**: Run migration script:
```bash
DATABASE_URL="your-url" npx tsx scripts/add-wordpress-media-fields.ts
```

### Import is very slow

**Issue**: Using page-by-page mode
**Fix**: Enable "Use bulk import" and set batch size to 5-10

### Some media items fail to import

**Check Error Log**: Scroll to errors section to see which items failed and why
**Common causes**:
- Invalid media URL
- Missing required fields
- Database constraint violations

**Fix**: Review error details and manually fix if needed

### Import gets stuck

**Issue**: Large batch size causing timeout
**Fix**: Reduce batch size to 3-5 pages

## Advanced Usage

### Import Specific Pages

Disable "Auto-process all pages" and manually process page ranges:

```typescript
// Import pages 10-15 only
const result = await fetch('/api/admin/media/bulk-import', {
  method: 'POST',
  body: JSON.stringify({
    startPage: 10,
    batchSize: 6,
    perPage: 100
  })
});
```

### Re-import Updated Media

The system automatically skips duplicates, so you can safely re-run imports. Only new media will be added.

To force re-import:
1. Delete existing media from database
2. Re-run import

### Export Media List

```sql
-- Get all WordPress media
SELECT
  "wordpressId",
  filename,
  url,
  "mimeType",
  width,
  height,
  "createdAt"
FROM media
WHERE "wordpressId" IS NOT NULL
ORDER BY "createdAt" DESC;
```

## Files Created

### Admin Pages
- `pages/admin/media/import.tsx` - Import UI with progress tracking
- `pages/admin/media/MediaImport.module.css` - Styling

### API Endpoints
- `pages/api/admin/media/scrape-wordpress.ts` - Single page import
- `pages/api/admin/media/bulk-import.ts` - Batch import (faster)

### Scripts
- `scripts/add-wordpress-media-fields.ts` - Database migration

### Documentation
- `MEDIA_IMPORT_GUIDE.md` - This file

## Next Steps

After importing media:

1. **Verify Import**
   ```sql
   SELECT COUNT(*) FROM media WHERE "wordpressId" IS NOT NULL;
   ```

2. **View in Media Library**
   - Navigate to existing media library UI
   - All WordPress media should now appear

3. **Use in Content**
   - Media can now be selected in post editor
   - URLs are preserved from WordPress

4. **Schedule Incremental Updates** (Optional)
   - Set up cron job to import new media daily
   - Uses same import endpoint
   - Automatically skips existing media

## Support

For issues or questions:
1. Check error logs in import UI
2. Review this documentation
3. Check database migration ran successfully
4. Verify environment variables are set

## Performance Tips

1. **Use bulk import** for initial import (5-10x faster)
2. **Batch size**: 5-10 pages for optimal speed
3. **Items per page**: Keep at 100 (WordPress API limit)
4. **Network**: Ensure stable connection for large imports
5. **Database**: Add indexes (migration does this automatically)

## Future Enhancements

Potential improvements:
- [ ] Background job queue for very large imports
- [ ] Download and optimize images locally
- [ ] Support for other media types (videos, PDFs)
- [ ] Incremental sync scheduled task
- [ ] Image CDN integration
- [ ] Automatic thumbnail generation
