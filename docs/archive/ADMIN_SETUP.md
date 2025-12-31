# SUCCESS Admin Dashboard Setup Guide

Your complete admin dashboard system has been built! This mirrors WordPress functionality but is entirely self-contained.

## 🎯 What's Been Created

### Database Schema (Prisma)
- **Users** - Multi-admin system with roles (Super Admin, Admin, Editor, Author)
- **Posts** - Articles with categories, tags, featured images
- **Categories & Tags** - Organization system
- **Media** - File library
- **Pages** - Static content (About, etc.)
- **Videos & Podcasts** - Custom post types

### API Endpoints (WordPress-compatible format)
- `/api/posts` - CRUD operations for posts
- `/api/posts/[id]` - Individual post operations
- `/api/categories` - Category management
- `/api/users` - User management
- `/api/videos` - Video content
- `/api/podcasts` - Podcast content

### Admin Dashboard
- `/admin/login` - Authentication
- `/admin` - Dashboard home with stats
- `/admin/posts` - Post management
- `/admin/posts/new` - Create new post with rich text editor
- More admin routes ready to build (categories, users, media, etc.)

## 🚀 Setup Instructions

### 1. Set Up Database

Choose ONE of these options:

#### Option A: Vercel Postgres (Recommended for Vercel deployment)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Create database
vercel postgres create

# This will give you a DATABASE_URL
```

#### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Get your database connection string from Settings > Database

#### Option C: Local PostgreSQL
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Windows: Download from postgresql.org

# Create database
createdb success_db
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# For Vercel Postgres, it looks like:
# DATABASE_URL="postgres://default:xxxxx@xxxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# WordPress API (keep for now, we'll migrate content later)
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
```

Generate NEXTAUTH_SECRET:
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Run Database Migrations

```bash
# Generate Prisma client and create database tables
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 4. Create Your First Admin User

```bash
# Run the seed script (we'll create this next)
npm run seed
```

Or manually create via Prisma Studio:
```bash
npx prisma studio
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Access Admin Dashboard

1. Go to http://localhost:3000/admin/login
2. Login with your admin credentials
3. Start creating content!

## 📁 Project Structure

```
pages/
├── api/
│   ├── auth/
│   │   └── [...nextauth].js      # Authentication
│   ├── posts/
│   │   ├── index.js               # List/Create posts
│   │   └── [id].js                # Get/Update/Delete post
│   ├── categories/index.js        # Category management
│   ├── users/index.js             # User management
│   ├── videos/index.js            # Video content
│   └── podcasts/index.js          # Podcast content
│
├── admin/
│   ├── login.tsx                  # Admin login page
│   ├── index.tsx                  # Dashboard home
│   └── posts/
│       ├── index.tsx              # Posts list
│       └── new.tsx                # Create post
│
├── blog/[slug].tsx                # Public blog post (reads from API)
└── category/[slug].tsx            # Public category page

components/
└── admin/
    ├── AdminLayout.tsx            # Admin sidebar & navigation
    ├── DashboardStats.tsx         # Stats cards
    └── PostEditor.tsx             # Rich text post editor

prisma/
└── schema.prisma                  # Database schema

lib/
├── prisma.js                      # Prisma client
└── wordpress.js                   # API client (will point to your API)
```

## 🔄 Migration from WordPress

To migrate existing WordPress content:

1. Keep `WORDPRESS_API_URL` in `.env.local`
2. Run migration script (we can create this)
3. Update `lib/wordpress.js` to use your local API
4. Test thoroughly
5. Remove WordPress dependency

## ✨ Features

### Admin Dashboard
- ✅ Multi-user authentication with roles
- ✅ Rich text editor (React Quill)
- ✅ Category management
- ✅ Featured image support
- ✅ Draft/Published workflow
- ✅ SEO metadata fields
- ✅ WordPress-compatible REST API

### To Add (Future)
- Media upload system
- Tag management
- User profile management
- Bulk actions
- Search & filters
- Image optimization
- Comments system

## 🛠️ Development Commands

```bash
# Database
npx prisma studio              # Visual database editor
npx prisma migrate dev         # Create new migration
npx prisma generate            # Regenerate Prisma client
npx prisma db push             # Push schema without migration

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production server
```

## 🔐 User Roles

- **SUPER_ADMIN** - Full system access
- **ADMIN** - Manage all content and users
- **EDITOR** - Manage all posts
- **AUTHOR** - Manage own posts only

## 📝 API Usage Examples

### Create a Post
```javascript
POST /api/posts
{
  "title": "My First Post",
  "slug": "my-first-post",
  "content": "<p>Post content here</p>",
  "excerpt": "Brief summary",
  "status": "PUBLISHED",
  "authorId": "user-id",
  "categories": ["cat-id-1", "cat-id-2"]
}
```

### Get Posts (WordPress-compatible)
```javascript
GET /api/posts?_embed=true&per_page=10&page=1
```

## 🚨 Troubleshooting

**Database connection error:**
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

**Prisma Client error:**
- Run `npx prisma generate`
- Delete `node_modules/.prisma` and regenerate

**NextAuth error:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain

## 🎉 Next Steps

1. Set up your database
2. Run migrations
3. Create admin user
4. Login to /admin
5. Create your first post!

Need help? Check the Prisma docs (prisma.io) or NextAuth docs (next-auth.js.org)
