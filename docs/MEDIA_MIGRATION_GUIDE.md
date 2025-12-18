# Media Migration Guide: WordPress to Cloudflare R2

## Overview

This guide walks you through migrating your WordPress media library to Cloudflare R2 for use with your Next.js application.

## Why Cloudflare R2?

- **Zero egress fees** (AWS S3 charges $0.09/GB - adds up fast!)
- **Cost-effective**: $0.015/GB/month storage (100GB = $1.50/month)
- **S3-compatible API** (easy to switch if needed)
- **Global CDN** included
- **Unlimited bandwidth** at no extra cost
- **Works perfectly with Vercel** deployments

## Step-by-Step Migration

### 1. Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create Bucket**
4. Name your bucket: `success-magazine-media`
5. Choose a location (automatic is fine)
6. Click **Create Bucket**

### 2. Get R2 API Credentials

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Give it a name: `rclone-upload`
4. Set permissions: **Object Read & Write**
5. Click **Create API Token**
6. **Save these credentials** (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (e.g., `https://xxxxx.r2.cloudflarestorage.com`)

### 3. Set Up Public Access

#### Option A: Use R2.dev subdomain (easiest)
1. In your bucket settings, enable **Public Access**
2. Your public URL will be: `https://pub-xxxxx.r2.dev`

#### Option B: Custom domain (recommended for production)
1. In bucket settings, click **Connect Domain**
2. Add your domain: `media.success.com`
3. Add the CNAME record to your DNS:
   ```
   media.success.com CNAME success-magazine-media.xxxxx.r2.cloudflarestorage.com
   ```
4. Wait for DNS propagation (5-60 minutes)

### 4. Install Rclone

**Windows:**
```powershell
# Download from https://rclone.org/downloads/
# Or use Chocolatey:
choco install rclone
```

**Mac:**
```bash
brew install rclone
```

**Linux:**
```bash
curl https://rclone.org/install.sh | sudo bash
```

### 5. Configure Rclone for R2

```bash
rclone config
```

Follow these prompts:
```
n) New remote
name> r2
Type of storage> s3
Choose your S3 provider> Cloudflare
Get AWS credentials from runtime> 1 (Enter manually)
AWS Access Key ID> [YOUR ACCESS KEY ID]
AWS Secret Access Key> [YOUR SECRET ACCESS KEY]
Region to connect to> auto
Endpoint for S3 API> [YOUR ENDPOINT URL]
Location constraint> [Leave blank]
ACL used when creating buckets> [Leave blank]
Server-side encryption> [Leave blank]
Storage class> [Leave blank]
Edit advanced config? n
Remote config OK? y
```

### 6. Test the Connection

```bash
# List buckets
rclone lsd r2:

# You should see your bucket: success-magazine-media
```

### 7. Upload WordPress Media

#### If you have direct access to WP Engine server:

```bash
# SSH into your WP Engine server
ssh your-site@your-site.ssh.wpengine.net

# Navigate to uploads folder
cd wp-content/uploads

# Sync to R2 (dry run first to test)
rclone sync . r2:success-magazine-media --dry-run --progress

# If dry run looks good, run the actual sync
rclone sync . r2:success-magazine-media --progress --transfers 32
```

#### If downloading from WordPress admin:

```bash
# Option 1: Use WP-CLI
wp media export

# Option 2: Use FTP/SFTP to download wp-content/uploads
# Then sync from your local machine:
rclone sync /path/to/local/uploads r2:success-magazine-media --progress --transfers 32
```

#### Sync options explained:
- `--progress`: Show progress during transfer
- `--transfers 32`: Upload 32 files simultaneously (faster!)
- `--dry-run`: Test without actually uploading (remove for real upload)
- `--checksum`: Verify file integrity (slower but safer)

### 8. Verify Upload

```bash
# List files in R2
rclone ls r2:success-magazine-media | head -20

# Check total size
rclone size r2:success-magazine-media
```

### 9. Update Environment Variables

Update your `.env.local`:

```env
# Replace with your actual WPGraphQL endpoint
WPGRAPHQL_URL=https://your-site.wpengine.com/graphql

# Replace with your R2 public URL
NEXT_PUBLIC_MEDIA_CDN_URL=https://pub-xxxxx.r2.dev
# OR if using custom domain:
NEXT_PUBLIC_MEDIA_CDN_URL=https://media.success.com
```

### 10. Update WordPress Domain in Transform Helper

Edit `lib/transformMediaUrls.js`:

```javascript
// Update these to match your WordPress site
const WP_DOMAIN = 'https://your-actual-site.wpengine.com';
const WP_UPLOADS_PATH = '/wp-content/uploads/';
```

### 11. Test Your Pages

```bash
npm run dev
```

Visit a magazine page and check:
1. ✅ Featured images load from R2
2. ✅ Images in content load from R2
3. ✅ ACF images load from R2
4. ✅ No 404 errors in browser console

### 12. Deploy to Vercel

```bash
# Add environment variable to Vercel
vercel env add NEXT_PUBLIC_MEDIA_CDN_URL production

# Enter your R2 public URL when prompted
# Then redeploy
vercel --prod
```

## Cost Estimate

For a large magazine site with 100GB of media:

**Storage Cost:**
- 100GB × $0.015/GB = **$1.50/month**

**Class A Operations** (writes):
- 1,000 uploads = $0.0045 (basically free)

**Class B Operations** (reads):
- 1,000,000 requests = $0.36/month

**Egress (bandwidth):**
- **$0.00** (FREE with R2!)

**Total Monthly Cost: ~$2-3/month** 🎉

Compare to AWS S3:
- Storage: 100GB × $0.023 = $2.30
- Egress: 100GB × $0.09 = **$9.00**
- **Total: ~$11-12/month** (4x more expensive!)

## Ongoing Sync

If you continue to add media to WordPress, set up a cron job:

```bash
# Add to crontab (Linux/Mac)
crontab -e

# Add this line to sync hourly:
0 * * * * rclone sync /path/to/wp-content/uploads r2:success-magazine-media --transfers 32 >> /var/log/rclone-sync.log 2>&1
```

Or use GitHub Actions to sync on schedule.

## Troubleshooting

### Images not loading?

1. **Check CORS settings** in R2 bucket settings:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

2. **Check public access** is enabled

3. **Verify URL transformation** is working:
   - Check browser DevTools Network tab
   - Ensure images are loading from your R2 domain

### Upload failed?

- Check your API token has **Object Read & Write** permissions
- Verify endpoint URL is correct
- Try with fewer `--transfers` (maybe your connection is slow)

### Need to re-sync?

```bash
# Force re-upload everything (overwrite)
rclone sync /local/uploads r2:success-magazine-media --progress --transfers 32

# Only upload new/changed files (faster)
rclone sync /local/uploads r2:success-magazine-media --progress --transfers 32 --update
```

## Advanced: Image Optimization

Once your media is in R2, you can add Cloudflare Image Resizing:

1. Enable **Cloudflare Images** in your dashboard
2. Use image transformation URLs:
   ```
   https://media.success.com/cdn-cgi/image/width=800,quality=85/path/to/image.jpg
   ```

This gives you:
- Automatic WebP conversion
- On-the-fly resizing
- Quality optimization
- Faster loading

## Support

If you run into issues:
- [Rclone Docs](https://rclone.org/docs/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
