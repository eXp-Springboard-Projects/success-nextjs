# Social Media Auto-Poster System

Complete system for scheduling and auto-posting content to Twitter/X, LinkedIn, Facebook, and Instagram.

## Features

✅ **Multi-Platform Support**
- Twitter / X
- LinkedIn
- Facebook Pages
- Instagram (via Facebook Graph API)

✅ **Scheduling**
- Post immediately
- Schedule for specific date/time
- Calendar view of scheduled posts
- Queue management

✅ **Auto-Posting**
- Auto-generate posts from published articles
- Queue for review or post immediately
- Background processing of scheduled posts

✅ **Account Management**
- Connect multiple accounts per platform
- OAuth 2.0 authentication
- Token refresh handling
- Account status monitoring

## Setup Instructions

### 1. Database Setup

Run the migration to create required tables:

\`\`\`bash
DATABASE_URL="your-database-url" npx tsx scripts/add-social-media-tables.ts
\`\`\`

This creates:
- `social_accounts` - Connected social media accounts
- `social_posts` - Scheduled and posted content
- `social_post_results` - Posting results per platform

### 2. Environment Variables

Add these to your `.env.local` file:

\`\`\`env
# Twitter / X API
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Facebook API
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Instagram API (uses Facebook)
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

# Cron Secret (for background jobs)
CRON_SECRET=your-secret-token-here
\`\`\`

### 3. Platform API Setup

#### Twitter / X
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Enable OAuth 2.0
4. Add callback URL: `https://yourdomain.com/api/admin/social-media/oauth/twitter/callback`
5. Request scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
6. Copy Client ID and Client Secret to `.env.local`

#### LinkedIn
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add redirect URL: `https://yourdomain.com/api/admin/social-media/oauth/linkedin/callback`
4. Request permissions: `w_member_social`, `r_liteprofile`
5. Copy Client ID and Client Secret to `.env.local`

#### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app (Business type)
3. Add Facebook Login product
4. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/facebook/callback`
5. Request permissions: `pages_manage_posts`, `pages_read_engagement`
6. Copy App ID and App Secret to `.env.local`

#### Instagram
1. Use same Facebook app from above
2. Add Instagram Basic Display or Instagram Graph API product
3. Request permissions: `instagram_basic`, `instagram_content_publish`
4. Instagram posting requires a Facebook Page connected to an Instagram Business Account

### 4. Cron Job Setup

Set up a cron job to process scheduled posts every 5-15 minutes:

**Using Vercel Cron:**
\`\`\`json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/social-media/process-queue",
    "schedule": "*/15 * * * *"
  }]
}
\`\`\`

**Using external service (cron-job.org, etc.):**
\`\`\`bash
curl -X GET \\
  -H "Authorization: Bearer YOUR_CRON_SECRET" \\
  https://yourdomain.com/api/admin/social-media/process-queue
\`\`\`

## Usage

### For Admins

1. **Connect Accounts**
   - Navigate to `/admin/social-media`
   - Click "Connect" on any platform
   - Authorize the app
   - Account will appear as connected

2. **Schedule a Post**
   - Go to `/admin/social-media/scheduler`
   - Enter your content (respects character limits per platform)
   - Select platforms to post to
   - Choose "Post Now" or "Schedule for Later"
   - Preview shows how it will look

3. **View Queue**
   - Go to `/admin/social-media/queue`
   - See all scheduled, posted, and failed posts
   - Edit or delete scheduled posts
   - View posting results per platform

4. **Auto-Post Articles**
   - When publishing an article, it can automatically:
     - Generate a social media post
     - Queue for review (recommended)
     - Post immediately

### For Developers

**Generate social post from article:**
\`\`\`typescript
import { generateSocialPostFromArticle } from '@/lib/social-media-poster';

const postContent = generateSocialPostFromArticle({
  title: article.title,
  excerpt: article.excerpt,
  slug: article.slug,
  featuredImage: article.featuredImage,
});
\`\`\`

**Auto-post when article is published:**
\`\`\`typescript
// In your publish article API
await fetch('/api/admin/social-media/auto-post-article', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    articleId: article.id,
    postImmediately: false, // Queue for review
    platforms: ['twitter', 'linkedin'], // Optional
  }),
});
\`\`\`

## File Structure

\`\`\`
pages/admin/social-media/
├── index.tsx                          # Connections page
├── scheduler.tsx                      # Schedule posts
├── queue.tsx                          # View queue
├── SocialMedia.module.css            # Shared styles
├── Scheduler.module.css
└── Queue.module.css

pages/api/admin/social-media/
├── accounts/
│   ├── index.ts                       # List accounts
│   └── [id].ts                        # Delete account
├── posts/
│   ├── index.ts                       # Create/list posts
│   └── [id].ts                        # Get/delete post
├── oauth/
│   └── [platform]/
│       ├── authorize.ts               # OAuth authorization
│       └── callback.ts                # OAuth callback
├── process-queue.ts                   # Background job
└── auto-post-article.ts              # Auto-post from articles

lib/
└── social-media-poster.ts            # Posting logic

scripts/
└── add-social-media-tables.ts        # Database migration
\`\`\`

## Platform-Specific Notes

### Twitter / X
- Character limit: 280
- Supports text, images, and links
- Link previews generated automatically

### LinkedIn
- Character limit: 3000
- Best for professional content
- Link previews with rich cards

### Facebook
- Character limit: 63,206
- Supports text, images, links, and videos
- Optimal post length: 40-80 characters

### Instagram
- **Requires an image**
- Character limit: 2,200
- Must be connected to a Facebook Page
- Requires Instagram Business Account

## Troubleshooting

**OAuth Connection Fails:**
- Verify callback URLs match exactly
- Check API credentials are correct
- Ensure app is in production mode (not sandbox)

**Posts Not Being Published:**
- Check cron job is running
- Verify CRON_SECRET is set correctly
- Review post status in queue

**Token Expired Errors:**
- Tokens expire after a period
- Refresh tokens should auto-renew
- May need to reconnect account

## Security Notes

- All OAuth tokens are stored encrypted
- Never commit API credentials to git
- Use environment variables for all secrets
- CRON_SECRET protects background jobs
- Only admins can access social media features

## Future Enhancements

- [ ] Image upload directly in scheduler
- [ ] Post analytics and engagement tracking
- [ ] A/B testing for post content
- [ ] Best time to post recommendations
- [ ] Hashtag suggestions
- [ ] Multi-image carousels
- [ ] Video support
- [ ] Thread/multi-tweet support for Twitter
- [ ] Post templates
- [ ] Bulk scheduling

---

**Created:** December 2025
**Version:** 1.0.0
**Maintainer:** SUCCESS Magazine Dev Team
