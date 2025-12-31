# Admin Dashboard Post Features

## Archive Feature ✅

Posts can now be archived directly from the admin dashboard.

### How to Archive Posts:

1. **Individual Post Archive:**
   - In the Posts list, click "Archive" link under any post
   - Archived posts won't appear on the public website
   - Can be found by clicking the "Archived" tab in the status filters

2. **Bulk Archive:**
   - Select multiple posts using checkboxes
   - Choose "Archive" from the "Bulk Actions" dropdown
   - Click "Apply"

### Archive Status:
- **Color**: Amber/Yellow background (#fef3c7)
- **Icon**: 📦 (archived box)
- **Behavior**: Archived posts are hidden from public view but remain in the database
- **Recovery**: Archived posts can be moved back to Published or Draft status

---

## Post Editor Layout Features ✅

The Enhanced Post Editor (`/admin/posts/new`) maintains ALL previous layout capabilities:

### 1. **Full-Width Images**
- Large hero images that span the entire content width
- Perfect for impactful visual storytelling

### 2. **Two-Column Text**
- Split content into side-by-side columns
- Great for comparisons or multi-topic sections

### 3. **Image + Text Layouts**
- **Image Left** - Image on left, text wraps on right
- **Image Right** - Image on right, text wraps on left
- Ideal for featured content with images

### 4. **Pull Quotes**
- Large, styled quotes that stand out from body text
- Emphasize key messages and testimonials

### 5. **Callout Boxes**
- Highlighted text boxes for important information
- Multiple styles: Info, Warning, Success, Error
- Great for tips, warnings, or key takeaways

### 6. **Image Galleries**
- Multi-image grids
- Lightbox viewing
- Captions and alt text support

### 7. **Video Embeds**
- YouTube integration
- Vimeo support
- Custom video players
- Responsive embed sizing

### 8. **Author Bio Boxes**
- Rich author profiles within content
- Photo, bio, and social links
- Can be placed anywhere in the post

### 9. **Related Articles**
- Automated related content suggestions
- Manual selection option
- Thumbnail + excerpt display

### 10. **Dividers**
- Visual section breaks
- Multiple styles (line, dots, stars)
- Spacing controls

### 11. **Button Blocks**
- Call-to-action buttons
- Customizable text and links
- Multiple color schemes
- Alignment options

### 12. **Standard Editor Features**
- **Rich Text Formatting**
  - Headings (H1-H6)
  - Bold, Italic, Underline
  - Text colors
  - Highlight colors
  - Text alignment

- **Lists**
  - Bulleted lists
  - Numbered lists
  - Nested lists

- **Links**
  - External links
  - Internal links
  - Link editing

- **Tables**
  - Add/remove rows and columns
  - Table headers
  - Resizable columns

- **Images**
  - Upload from media library
  - Drag & drop
  - Image editor (crop, resize, filters)
  - Alt text
  - Captions

---

## Post Status Options

All standard WordPress statuses are supported:

- **Published** ✅ - Live on the website
- **Draft** 📝 - Work in progress, not public
- **Pending** ⏳ - Awaiting review
- **Scheduled** 📅 - Publish at future date/time
- **Archived** 📦 - Hidden from public, preserved in database

---

## Content Types

Posts can be categorized by content type:

- **Regular** - Standard blog posts
- **Premium** - SUCCESS+ exclusive content
- **Insider** - Insider tier exclusive
- **Magazine** - Magazine article
- **Press** - Press releases

---

## Additional Features

### Auto-Save
- Automatically saves drafts every 3 seconds
- Prevents data loss
- Shows "Last saved" timestamp

### Media Library
- Upload images, videos, documents
- Organize by folders
- Search and filter
- Image editing tools

### SEO Controls
- Meta title
- Meta description
- Canonical URL
- Keywords

### Scheduling
- Publish immediately
- Schedule for future date/time
- Timezone-aware

### Categories & Tags
- Multiple category selection
- Tag management
- Hierarchical categories

### Featured Images
- Set post thumbnail
- Alt text
- Caption
- Image editor

### Revision History
- Track all changes
- Restore previous versions
- Compare revisions

### Word Count
- Real-time word count
- Character count
- Reading time estimate

---

## Archive Implementation Details

### Database Changes:
- Posts table now accepts 'ARCHIVED' status
- No schema migration needed (status is text field)

### UI Changes:
1. Added "Archived" tab to status filters
2. Added "Archive" option to bulk actions dropdown
3. Added "Archive" link to individual post row actions
4. Added amber styling for archived posts (`.status.archived`)

### Filter Support:
- Click "Archived (X)" tab to view only archived posts
- Archived posts are excluded from default "All" and "Published" views
- Can be combined with search, author, category, and date filters

---

## Post Editor Access

- Navigate to `/admin/posts/new` to create new posts
- All layout blocks available via the block menu (+ button)
- Blocks can be added, moved, edited, and deleted
- Full WYSIWYG editing experience
- Live preview available

---

## Notes

- Archive is NOT the same as delete - archived posts remain in the database
- Archived posts can be restored to Published or Draft at any time
- The post editor maintains the exact same layout capabilities as before
- No features were removed - all editor extensions are preserved
