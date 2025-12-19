# Social Media Auto-Poster Setup Guide

## Overview

The SUCCESS Magazine platform now supports automatic posting to **6 social media platforms**:

- ✅ Twitter / X
- ✅ LinkedIn
- ✅ Facebook
- ✅ Instagram
- ✅ YouTube
- ✅ TikTok

## Database Tables

The following tables have been created:

- `social_accounts` - Stores OAuth tokens for connected accounts
- `social_posts` - Scheduled and posted content
- `social_post_results` - Track posting results per platform

## Required Environment Variables

Add these to your `.env.local` file:

### Twitter / X
```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

**Setup Instructions:**
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing app
3. Enable OAuth 2.0
4. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/twitter/callback`
5. Request permissions: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

### LinkedIn
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

**Setup Instructions:**
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/linkedin/callback`
4. Request permissions: `w_member_social`, `r_liteprofile`

### Facebook
```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Setup Instructions:**
1. Go to https://developers.facebook.com/apps
2. Create a new app (Business type)
3. Add Facebook Login product
4. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/facebook/callback`
5. Request permissions: `pages_manage_posts`, `pages_read_engagement`

### Instagram
```env
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

**Setup Instructions:**
1. Instagram uses Facebook Graph API - same setup as Facebook
2. Add Instagram Graph API product to your Facebook app
3. Request permissions: `instagram_basic`, `instagram_content_publish`
4. Connect your Instagram Business account

### YouTube
```env
YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
```

**Setup Instructions:**
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/youtube/callback`
6. Request scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.force-ssl`

### TikTok
```env
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

**Setup Instructions:**
1. Go to https://developers.tiktok.com/
2. Create a new app
3. Add Login Kit and Content Posting API
4. Add redirect URI: `https://yourdomain.com/api/admin/social-media/oauth/tiktok/callback`
5. Request scopes: `user.info.basic`, `video.upload`, `video.publish`

## How to Connect Accounts

1. Log in to admin dashboard
2. Navigate to **Admin** > **Social Media Auto-Poster**
3. Click **Connect** on any platform
4. Authorize the SUCCESS Magazine app
5. You'll be redirected back with the account connected

## Platform Features

### Twitter / X
- Post text up to 280 characters
- Include images and links
- Auto-shorten URLs

### LinkedIn
- Share professional content up to 3,000 characters
- Include images, videos, and article links
- Post to personal profile or company page

### Facebook
- Post to Facebook pages
- Up to 63,206 characters
- Include images, videos, and links

### Instagram
- Post photos with captions up to 2,200 characters
- Auto-format for Instagram
- Requires business account

### YouTube
- Upload videos to your channel
- Community posts (text + images)
- Up to 5,000 characters for descriptions

### TikTok
- Upload short-form videos
- Captions up to 2,200 characters
- Auto-format for TikTok requirements

## Scheduling Posts

1. Go to **Schedule Post** in social media dashboard
2. Write your content
3. Select which platforms to post to
4. Choose "Post Now" or schedule for later
5. Add optional image/video and link

## Auto-Posting Articles

When you publish an article in the CMS:

1. Check "Auto-post to social media"
2. Select platforms
3. Customize the social media message
4. Article will be posted when published

## Character Limits by Platform

- Twitter/X: 280 characters
- LinkedIn: 3,000 characters
- Facebook: 63,206 characters
- Instagram: 2,200 characters
- YouTube: 5,000 characters (description)
- TikTok: 2,200 characters

## Security & Privacy

- All OAuth tokens are encrypted in the database
- Tokens are refreshed automatically when needed
- You can disconnect any account at any time
- Minimum required permissions are requested
- No access to private messages or DMs

## Troubleshooting

### "OAuth not configured" error
Make sure the environment variables are set in `.env.local` for that platform.

### "Token expired" error
Disconnect and reconnect the account to refresh the OAuth token.

### "Failed to post" error
Check the platform's posting limits and API status. View detailed error in the queue.

## Support

For issues or questions:
- Check platform API documentation
- Review error messages in the social media queue
- Contact development team

---

**Last Updated:** December 19, 2024
