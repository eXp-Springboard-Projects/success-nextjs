# Content Archive Feature

## Overview
The SUCCESS platform now includes a comprehensive archive system for posts and pages. This allows you to preserve old content without permanently deleting it, maintaining a historical record while keeping the active site clean.

---

## How It Works

### Archive vs Delete

**Archive (Recommended):**
- ✅ Hides content from public view
- ✅ Keeps content in database
- ✅ Can be restored at any time
- ✅ Maintains historical record
- ✅ Preserves SEO redirects

**Delete (Permanent):**
- ❌ Completely removes content
- ❌ Cannot be undone
- ❌ Loses all historical data
- ⚠️ Only use when absolutely necessary

---

## Using the Archive Feature

### From Content Viewer

1. **Navigate to Content Viewer**
   - Go to `/admin/content-viewer`
   - You'll see all active posts, pages, videos, and podcasts

2. **Archive Content**
   - Find the item you want to archive
   - Click the orange **"Archive"** button
   - Confirm the action
   - Content is now hidden from public view

3. **View Archived Content**
   - Click the **"📁 Archived"** tab at the top
   - See all archived content in one place
   - Or check **"Show archived content"** checkbox to see archived items mixed with active content

4. **Restore Archived Content**
   - Go to the **"📁 Archived"** tab
   - Find the item to restore
   - Click the green **"Unarchive"** button
   - Content is restored to PUBLISHED status

5. **Permanently Delete (Use Caution!)**
   - Only delete if you're absolutely sure
   - The system will warn you before deleting
   - Consider archiving instead

---

## Content States

Your content can be in one of three states:

| Status | Visibility | Can Edit | Can Restore |
|--------|-----------|----------|-------------|
| **DRAFT** | Hidden from public | ✅ Yes | N/A |
| **PUBLISHED** | Visible on site | ✅ Yes | N/A |
| **ARCHIVED** | Hidden from public | ✅ Yes | ✅ Yes |

---

## Default Behavior

### What You See
- **By default**: Only active content (DRAFT and PUBLISHED) is shown
- **Archived content is hidden** unless you:
  - Go to the "📁 Archived" tab, OR
  - Check "Show archived content" checkbox

### WordPress Sync
- Content synced from WordPress remains editable
- Archive status is stored in the local database
- Archived WordPress content won't appear on the site

---

## Use Cases

### When to Archive:

1. **Outdated Information**
   - Old product announcements
   - Expired promotions
   - Dated content that's no longer relevant

2. **Seasonal Content**
   - Holiday-specific posts
   - Annual event coverage
   - Seasonal guides

3. **Historical Records**
   - Company milestones
   - Old press releases
   - Legacy documentation

4. **SEO Cleanup**
   - Thin content
   - Duplicate topics
   - Low-performing pages

5. **Content Refresh**
   - Before publishing updated versions
   - Consolidating multiple posts
   - Reorganizing site structure

### When to Delete:

1. **Spam or Malicious Content**
2. **Legal Requirements**
3. **Privacy Violations**
4. **Completely Irrelevant Content**
5. **Test/Dummy Content**

---

## Technical Details

### Database Schema
```sql
status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')
```

### API Endpoints

**Archive a Post:**
```bash
PATCH /api/admin/posts/{id}
{
  "status": "ARCHIVED"
}
```

**Unarchive a Post:**
```bash
PATCH /api/admin/posts/{id}
{
  "status": "PUBLISHED"
}
```

**Same for Pages:**
```bash
PATCH /api/admin/pages/{id}
{
  "status": "ARCHIVED" | "PUBLISHED"
}
```

### Content Counts

The Content Viewer shows counts for each category:
- **All Content**: Active content only (excludes archived)
- **Posts/Pages/Videos/Podcasts**: Active only
- **SUCCESS+**: Active premium content only
- **📁 Archived**: All archived content

---

## Best Practices

### ✅ DO:
- Archive old content instead of deleting
- Review archived content periodically
- Keep organized by using the archived tab
- Restore content if it becomes relevant again
- Archive before major content refreshes

### ❌ DON'T:
- Delete content unless absolutely necessary
- Archive current/relevant content
- Mix archived and active without good reason
- Forget to check archived before creating duplicates

---

## Migration from WordPress

If you have existing content from the WordPress site:

1. **Old WordPress Posts**: Automatically synced
2. **Archive as Needed**: Review and archive outdated content
3. **New Content**: Create through admin dashboard
4. **WordPress Updates**: Will continue to sync (unless archived)

---

## FAQ

**Q: Does archiving affect SEO?**
A: Archived content is hidden from the site, so it won't appear in sitemaps or be indexed. Consider setting up redirects for important archived pages.

**Q: Can I bulk archive content?**
A: Not yet - this feature is coming soon. For now, archive items individually.

**Q: What happens to archived WordPress content?**
A: It's stored locally with ARCHIVED status. The WordPress source remains unchanged.

**Q: Can I edit archived content?**
A: Yes! Click the "Edit" button from the archived tab.

**Q: How do I find a specific archived item?**
A: Go to the "📁 Archived" tab and browse by content type, or use browser search (Ctrl+F).

**Q: Will archived content be deleted automatically?**
A: No. Archived content stays in the database indefinitely unless you manually delete it.

**Q: Can I archive videos and podcasts?**
A: Yes! The archive system works for all content types: posts, pages, videos, and podcasts.

---

## Keyboard Shortcuts

When viewing the Content Viewer:
- Use tab navigation to switch between content types
- Click checkboxes for quick filtering

---

## Support

If you need help with the archive feature:
1. Check this documentation
2. Contact your admin team
3. Review the Content Viewer interface tooltips

---

*Last Updated: December 27, 2025*
