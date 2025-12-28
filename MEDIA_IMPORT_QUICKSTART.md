# WordPress Media Import - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Prepare Database
```bash
DATABASE_URL="postgres://..." npx tsx scripts/add-wordpress-media-fields.ts
```

### Step 2: Navigate to Import Page
Go to: **`/admin/media/import`**

### Step 3: Import!
1. Click "Run Dry Run" to preview (optional)
2. Click "Start Full Import"
3. Watch the progress bar!

---

## ⚙️ Recommended Settings

- **Items per page**: 100
- **Use bulk import**: ✓ Enabled
- **Batch size**: 5
- **Auto-process all pages**: ✓ Enabled

---

## 📊 What to Expect

For a site with **2,000 images**:
- **Bulk mode**: ~12 seconds
- **Page mode**: ~60 seconds

The system will:
- ✓ Skip duplicates automatically
- ✓ Show real-time progress
- ✓ Log all actions
- ✓ Handle errors gracefully

---

## ❓ Common Issues

### "WordPress API URL not configured"
**No action needed!** The scraper automatically tries:
1. `https://successcom.wpenginepowered.com/wp-json/wp/v2` (staging)
2. `https://www.success.com/wp-json/wp/v2` (production)
3. Your env variables if set

If you want to force a specific endpoint, add to `.env.local`:
```bash
WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2
```

### "wordpressId column not found"
```bash
# Run migration
DATABASE_URL="..." npx tsx scripts/add-wordpress-media-fields.ts
```

### Import too slow?
Enable "Use bulk import" checkbox

---

## 📁 Where's My Media?

After import, check:
1. Your existing media library UI
2. Database: `SELECT COUNT(*) FROM media WHERE "wordpressId" IS NOT NULL;`
3. Can now use in post editor!

---

## 🎯 Pro Tips

1. **First time?** Run dry run to see what you'll get
2. **Large site?** Use bulk import with batch size 5-10
3. **Re-import anytime** - duplicates are auto-skipped
4. **Monitor errors** - detailed error log at bottom of page

---

See **MEDIA_IMPORT_GUIDE.md** for full documentation.
