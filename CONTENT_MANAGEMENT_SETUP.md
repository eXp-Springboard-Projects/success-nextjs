# Content Management System - Setup Guide

This document explains the new Content Management features added to SUCCESS.com.

## ✨ New Features

### 1. Content Pillars (10 Categories)
Every article must be assigned to one of these content pillars:
- AI & Technology
- Business & Branding
- Culture & Workplace
- Entrepreneurship
- Leadership
- Longevity & Performance
- Money
- Philanthropy
- Professional Growth
- Trends & Insights

### 2. Author Management System
- Dedicated author profiles with bio, photo, and social links
- Author pages showing all their articles
- Searchable author dropdown in article editor
- Articles can use custom authors or default to staff user account

### 3. Homepage Featuring Controls
Staff can control article visibility with toggles:
- **Feature on Homepage** - Show in homepage sections
- **Feature in Pillar Section** - Highlight in pillar-specific sections
- **Show in Trending** - Display in trending sidebar
- **Main Featured Article** - Make this the hero article (only one at a time)

## 🚀 Setup Instructions

### Step 1: Run Database Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/add_authors_and_content_pillars.sql`
4. Copy the entire SQL and paste into SQL Editor
5. Click **"Run"**

**Option B: Via Command Line**

```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Access New Features

#### Author Management
1. Go to http://localhost:3000/admin (or your production URL)
2. Click **"Authors"** quick action
3. Create your first author profile
4. Fill in: Name, Slug, Bio, Photo URL, Title, Social links

#### Edit Articles
1. Go to http://localhost:3000/admin/posts
2. Open any article in the editor
3. In the **Settings** panel (right sidebar), you'll see:
   - **Content Pillar** dropdown (REQUIRED)
   - **Author** dropdown (optional, uses your name if blank)
   - **Homepage Display** toggles for featuring

### Step 3: Test the Features

1. **Create a Test Author:**
   - Name: "Test Author"
   - Slug: "test-author"
   - Add a bio and photo URL

2. **Edit a Test Article:**
   - Select a Content Pillar
   - Select the test author
   - Enable "Feature on Homepage"
   - Save the article

3. **Verify:**
   - Check that the article saves successfully
   - Content Pillar should be required (can't save without it)
   - Author should display correctly

## 📋 What Was Changed

### Database Changes
- Created `authors` table
- Added `ContentPillar` enum with 10 values
- Added to `posts` table:
  - `contentPillar` (enum, nullable)
  - `customAuthorId` (foreign key to authors)
  - `featureOnHomepage` (boolean)
  - `featureInPillar` (boolean)
  - `featureTrending` (boolean)
  - `mainFeaturedArticle` (boolean, unique constraint)

### API Endpoints Created
- `GET /api/admin/authors` - List all authors
- `POST /api/admin/authors` - Create new author
- `GET /api/admin/authors/[id]` - Get author details
- `PUT /api/admin/authors/[id]` - Update author
- `DELETE /api/admin/authors/[id]` - Delete/deactivate author
- `GET /api/authors/[slug]` - Public endpoint for author pages

### Updated API Endpoints
- `POST /api/admin/posts` - Now accepts new fields
- `PUT /api/admin/posts/[id]` - Now updates new fields

### New Admin Pages
- `/admin/authors` - Author management interface
- Dashboard updated with "Authors" quick action

### Article Editor Updates
- Content Pillar dropdown (REQUIRED field)
- Author selection dropdown (searchable)
- Homepage Display panel with 4 toggles
- Validation: Can't save without Content Pillar
- Warning when enabling "Main Featured Article"

## 🎯 Next Steps (Not Yet Implemented)

The following features were planned but not yet implemented:

1. **Author Pages** (`/author/[slug]`)
   - Display author profile
   - List all articles by author
   - Filter by content pillar
   - SEO optimization

2. **Article Byline Links**
   - Make author names clickable in articles
   - Link to author pages

3. **Featured Articles Manager**
   - Dashboard view of all featured articles
   - Quick toggle management
   - Conflict warnings

4. **Homepage Integration**
   - Use featuring toggles to control homepage display
   - Integration with existing featured content system

## 🐛 Troubleshooting

### Migration Fails with "relation already exists"
The migration is safe to re-run. It uses `IF NOT EXISTS` checks. If you see this error, the table already exists.

### Content Pillar dropdown shows enum values instead of labels
This shouldn't happen, but if it does, check that `getContentPillarLabel()` is imported correctly in the editor.

### Author dropdown is empty
Check that authors exist in the database and that the API endpoint `/api/admin/authors?active=true` returns data.

### "Main Featured Article" toggle doesn't work
Only one article can be the main featured article at a time. The database has a unique constraint to enforce this.

## 📝 Technical Notes

- All new database fields are nullable except booleans (default to false)
- Content Pillar is not enforced at database level but is required in the UI
- Authors can be soft-deleted (isActive=false) if they have articles
- The `mainFeaturedArticle` field has a unique partial index to ensure only one active
- All changes are backward compatible with existing articles

## 🆘 Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the terminal/Vercel logs for API errors
3. Verify the database migration ran successfully
4. Ensure you're logged in as SUPER_ADMIN, ADMIN, or EDITOR

---

**Implementation Date:** January 2026
**Status:** Core features complete, author pages pending
