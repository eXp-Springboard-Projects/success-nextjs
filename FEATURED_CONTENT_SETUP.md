# Featured Content Manager - Setup Instructions

## Quick Setup (2 minutes)

### Step 1: Create Database Table

Go to your **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
CREATE TABLE IF NOT EXISTS homepage_placements (
  id TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  zone TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdBy" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS homepage_placements_zone_active_idx
  ON homepage_placements(zone, active, position);

CREATE INDEX IF NOT EXISTS homepage_placements_postId_idx
  ON homepage_placements("postId");

CREATE UNIQUE INDEX IF NOT EXISTS homepage_placements_zone_position_key
  ON homepage_placements(zone, position) WHERE active = true;
```

### Step 2: Start Using It!

1. Visit **http://localhost:3000/admin/featured-content** (or your site URL)
2. Login as Super Admin/Admin
3. Search for articles and assign them to homepage zones:
   - **Hero** - Main featured article (1 slot)
   - **Secondary** - Grid of 4 featured articles
   - **Trending** - 3 trending articles

### Step 3: View Results

Visit your homepage - the articles you selected will now appear in their assigned zones!

## How It Works

- **With Featured Content**: Homepage shows your manually selected articles
- **Without Featured Content**: Homepage shows latest posts automatically (current behavior)
- **Fallback**: If zones aren't full, remaining slots fill with latest posts

## Features

✅ Real-time article search
✅ Drag-and-drop style assignment
✅ Per-zone slot management
✅ Automatic fallback to latest posts
✅ No site disruption - works seamlessly

## Access

- Dashboard: http://localhost:3000/admin
- Featured Content Manager: http://localhost:3000/admin/featured-content
- Homepage Preview: http://localhost:3000
