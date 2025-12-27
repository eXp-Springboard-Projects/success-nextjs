# Social Media Calendar & Auto-Poster - Setup Guide

## ✅ Completed Files

The following have been created:

### 1. Database
- `supabase/migrations/001_social_media_tables.sql` - Full database schema

### 2. Types & Utilities
- `types/social.ts` - All TypeScript types
- `lib/social/encryption.ts` - Token encryption/decryption
- `lib/social/supabase-auth.ts` - Supabase + NextAuth bridge
- `lib/social/platforms/twitter.ts` - Twitter API client
- `lib/social/platforms/linkedin.ts` - LinkedIn API client
- `lib/social/platforms/index.ts` - Platform router
- `lib/social/publisher.ts` - Post publishing logic
- `lib/social/scheduler.ts` - Queue & scheduling logic

### 3. API Routes
- `pages/api/social/accounts/index.ts` - List accounts
- `pages/api/social/accounts/[id].ts` - Get/delete account
- `pages/api/social/posts/index.ts` - List/create posts
- `pages/api/social/oauth/twitter/route.ts` - Twitter OAuth init
- `pages/api/social/cron/publish.ts` - Cron auto-publisher

---

## 🔨 TODO: Remaining Files to Create

Due to response length limits, you need to create these remaining files. Here's the code:

### API Routes

#### `pages/api/social/posts/[id].ts`
\`\`\`typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { SocialPost, UpdatePostRequest, ApiResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost | null>>
) {
  const session = await getServerSession(req, res, {} as any);
  if (!session?.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid post ID' });
  }

  if (req.method === 'GET') {
    return handleGet(userId, id, res);
  }

  if (req.method === 'PUT') {
    return handlePut(userId, id, req, res);
  }

  if (req.method === 'DELETE') {
    return handleDelete(userId, id, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(userId: string, id: string, res: NextApiResponse) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('social_posts')
    .select('*, results:social_post_results(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  return res.status(200).json({ success: true, data: data as SocialPost });
}

async function handlePut(userId: string, id: string, req: NextApiRequest, res: NextApiResponse) {
  const updates: UpdatePostRequest = req.body;
  const db = supabaseAdmin();

  // Verify ownership
  const { data: existing } = await db
    .from('social_posts')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const { data, error } = await db
    .from('social_posts')
    .update({
      content: updates.content,
      content_variants: updates.contentVariants,
      media_ids: updates.mediaIds,
      link_url: updates.linkUrl,
      scheduled_at: updates.scheduledAt,
      target_platforms: updates.targetPlatforms,
      status: updates.status,
      is_evergreen: updates.isEvergreen,
      evergreen_interval_days: updates.evergreenIntervalDays,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, data: data as SocialPost });
}

async function handleDelete(userId: string, id: string, res: NextApiResponse) {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from('social_posts')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  const { error } = await db.from('social_posts').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, data: null, message: 'Post deleted' });
}
\`\`\`

#### `pages/api/social/oauth/twitter/callback.ts`
\`\`\`typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { exchangeCodeForTokens, getTwitterUserInfo } from '@/lib/social/platforms/twitter';
import { verifyOAuthState } from '@/lib/social/encryption';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session?.user) {
    return res.redirect('/admin/login?error=unauthorized');
  }

  const { code, state } = req.query;

  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect('/admin/social-media/accounts?error=invalid_callback');
  }

  try {
    // Verify state
    const cookies = parse(req.headers.cookie || '');
    const expectedState = cookies.twitter_oauth_state;
    const codeVerifier = cookies.twitter_code_verifier;

    if (!expectedState || !verifyOAuthState(state, expectedState)) {
      throw new Error('Invalid OAuth state');
    }

    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Get user info
    const userInfo = await getTwitterUserInfo(tokens.accessToken);

    // Save to database
    const db = supabaseAdmin();
    const userId = session.user.id || session.user.email!;

    await db.from('social_accounts').upsert({
      user_id: userId,
      platform: 'twitter',
      platform_user_id: userInfo.id,
      platform_username: userInfo.username,
      platform_display_name: userInfo.name,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || null,
      token_expires_at: tokens.expiresAt || null,
      profile_image_url: userInfo.profileImageUrl,
      is_active: true,
    }, {
      onConflict: 'user_id,platform,platform_user_id'
    });

    // Clear OAuth cookies
    res.setHeader('Set-Cookie', [
      'twitter_oauth_state=; Path=/; HttpOnly; Max-Age=0',
      'twitter_code_verifier=; Path=/; HttpOnly; Max-Age=0',
    ]);

    return res.redirect('/admin/social-media/accounts?connected=twitter');
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return res.redirect(`/admin/social-media/accounts?error=${encodeURIComponent((error as Error).message)}`);
  }
}
\`\`\`

#### `pages/api/social/publish.ts` (Manual publish)
\`\`\`typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { publishPost } from '@/lib/social/publisher';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID required' });
  }

  try {
    const result = await publishPost(postId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
\`\`\`

---

## 📦 NPM Packages to Install

Run this command:

\`\`\`bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns react-dropzone recharts
\`\`\`

Note: `@dnd-kit/*` is already installed!

---

## 🔐 Environment Variables

Add to `.env.local`:

\`\`\`env
# Twitter API (Get from: https://developer.twitter.com/en/portal/dashboard)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn API (Get from: https://www.linkedin.com/developers/apps)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Cron secret (Generate with: openssl rand -hex 32)
CRON_SECRET=your_cron_secret_here

# Token encryption key (Generate with: openssl rand -base64 32)
SOCIAL_TOKEN_ENCRYPTION_KEY=your_encryption_key_here

# Base URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

---

## 🗄️ Run Database Migration

1. Go to your Supabase project: https://app.supabase.com/project/aczlassjkbtwenzsohwm
2. Click "SQL Editor"
3. Copy and paste the contents of `supabase/migrations/001_social_media_tables.sql`
4. Click "Run"

---

## ⏰ Setup Vercel Cron

Create `vercel.json` in your project root (or add to existing):

\`\`\`json
{
  "crons": [{
    "path": "/api/social/cron/publish",
    "schedule": "*/5 * * * *"
  }]
}
\`\`\`

Then in Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add `CRON_SECRET` with the value from your `.env.local`

---

## 🎨 UI Components (Create These Next)

I've set up the backend. Now you need the frontend. Here are the component skeletons you need to create:

### Basic Page Structure

1. **`pages/admin/social-media/index.tsx`** - Dashboard overview
2. **`pages/admin/social-media/calendar.tsx`** - Calendar view
3. **`pages/admin/social-media/composer.tsx`** - Create/edit posts
4. **`pages/admin/social-media/queue.tsx`** - Queue management
5. **`pages/admin/social-media/accounts.tsx`** - Connected accounts

### React Hooks

Create in `hooks/social/`:

1. **`useSocialAccounts.ts`** - Fetch/manage accounts
2. **`useSocialPosts.ts`** - CRUD posts
3. **`useMediaLibrary.ts`** - Upload/manage media

### Components

Create in `components/admin/social/`:

1. **`PostComposer.tsx`** - Rich text editor with platform previews
2. **`SocialCalendar.tsx`** - FullCalendar integration
3. **`QueueList.tsx`** - Draggable queue with dnd-kit
4. **`ConnectedAccountCard.tsx`** - Display connected platforms
5. **`PostCard.tsx`** - Post display in lists

---

## 🚀 Add to Navigation

Edit `components/admin/shared/DepartmentLayout.tsx` and add this line to the MARKETING section (around line 311):

\`\`\`typescript
{ label: 'Social Media', href: '/admin/social-media' },
\`\`\`

---

## 🧪 Testing Checklist

After setup:

- [ ] Run SQL migration in Supabase
- [ ] Add all environment variables
- [ ] Install NPM packages
- [ ] Create remaining API routes (callback, publish, media, etc.)
- [ ] Create UI pages and components
- [ ] Test Twitter OAuth flow
- [ ] Test creating a post
- [ ] Test publishing a post
- [ ] Verify cron job runs every 5 minutes

---

## 📝 Next Steps

1. Run the SQL migration
2. Add environment variables
3. Install NPM packages
4. Create the remaining API routes from this document
5. Create the UI components (I can help with those next!)
6. Add navigation link
7. Test OAuth connections

Would you like me to generate the UI components next?
