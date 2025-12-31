# Deploy to Staging.Success.com on Vercel

## Prerequisites
- Vercel account with SUCCESS.com team/org
- Domain access to success.com DNS
- Environment variables ready

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Link Project to Vercel

```bash
# Run from project root
vercel link
```

**Prompts:**
- Set up and deploy? → Y
- Which scope? → Select SUCCESS.com team/organization
- Link to existing project? → N (create new)
- What's your project name? → `success-nextjs`
- In which directory is your code? → `./`

## Step 4: Configure Environment Variables

Go to Vercel dashboard: https://vercel.com/[your-team]/success-nextjs/settings/environment-variables

**Add these variables:**

### Database
```
DATABASE_URL=postgres://default:9iXF2IrQGpwL@ep-cold-tooth-a4z49xhe-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require
```

### Authentication
```
NEXTAUTH_SECRET=your-production-secret-here
NEXTAUTH_URL=https://staging.success.com
```

### WordPress Integration
```
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
```

### Stripe (Production Keys)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayKickstart
```
PAYKICKSTART_API_KEY=your-api-key
PAYKICKSTART_WEBHOOK_SECRET=your-webhook-secret
```

## Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# This will:
# 1. Build the Next.js app
# 2. Generate Prisma client
# 3. Deploy to Vercel
# 4. Assign production domain
```

## Step 6: Configure Custom Domain (staging.success.com)

### Option A: Via Vercel Dashboard

1. Go to: https://vercel.com/[your-team]/success-nextjs/settings/domains
2. Click "Add Domain"
3. Enter: `staging.success.com`
4. Vercel will provide DNS instructions

### Option B: Via CLI

```bash
vercel domains add staging.success.com success-nextjs
```

## Step 7: Update DNS Settings

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)

**Add CNAME record:**
```
Type:  CNAME
Name:  staging
Value: cname.vercel-dns.com
TTL:   Auto or 3600
```

**Wait 5-60 minutes for DNS propagation**

## Step 8: Verify Deployment

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Open in browser
vercel open
```

Visit: https://staging.success.com

## Step 9: Run Database Migrations

```bash
# From local machine, connected to production DB
npx prisma migrate deploy
```

Or set up in Vercel build command:
```json
{
  "buildCommand": "prisma migrate deploy && prisma generate && next build"
}
```

## Step 10: Set Up Continuous Deployment

### Connect GitHub Repository

1. Go to: https://vercel.com/[your-team]/success-nextjs/settings/git
2. Connect to GitHub repository: `RachelNead/success-next`
3. Configure:
   - **Production Branch:** `main`
   - **Auto-deploy:** ✅ Enabled
   - **Build Command:** `prisma generate && next build`
   - **Output Directory:** `.next`

### Branch Deployments

Every push to GitHub will:
- `main` branch → https://staging.success.com (production)
- `develop` branch → https://success-nextjs-develop.vercel.app
- Feature branches → https://success-nextjs-[branch].vercel.app

## Troubleshooting

### Build Fails: "Prisma Client not generated"
**Solution:**
```bash
# Update build command
vercel build-command "prisma generate && next build"
```

### Build Fails: "Database connection error"
**Solution:**
- Verify `DATABASE_URL` in Vercel environment variables
- Check database is accessible from Vercel IPs
- Test connection: `npx prisma db pull`

### Domain not working
**Solution:**
- Check DNS propagation: https://dnschecker.org
- Verify CNAME record: `nslookup staging.success.com`
- Check Vercel domain status: `vercel domains ls`

### Slow Build Times
**Solution:**
- Enable caching in `next.config.js`
- Use `npm ci` instead of `npm install`
- Optimize dependencies

## Quick Deploy Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Rollback to previous deployment
vercel rollback

# Environment variables
vercel env ls
vercel env add DATABASE_URL production
vercel env pull .env.local
```

## Monitoring

### Set Up Monitoring

1. **Vercel Analytics** - Built-in (free)
   - Go to: https://vercel.com/[team]/success-nextjs/analytics

2. **Sentry** - Error tracking
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

3. **LogRocket** - Session replay
   ```bash
   npm install logrocket
   ```

### Set Up Alerts

Go to: https://vercel.com/[team]/success-nextjs/settings/notifications

Configure alerts for:
- ✅ Deployment failures
- ✅ Build errors
- ✅ Domain configuration issues

## Post-Deployment Checklist

- [ ] Site loads at https://staging.success.com
- [ ] Database connection works
- [ ] Authentication works (login/logout)
- [ ] Stripe payments work (test mode)
- [ ] WordPress API integration works
- [ ] Admin dashboard accessible
- [ ] Media uploads work
- [ ] Email sending works
- [ ] SSL certificate active
- [ ] Redirects working
- [ ] Analytics tracking
- [ ] Error monitoring active

## Production Launch Checklist (When Ready)

- [ ] All content migrated
- [ ] URLs redirected from WordPress
- [ ] Test all payment flows
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Team trained on admin dashboard
- [ ] Rollback plan documented
- [ ] Update DNS: `www.success.com` → Vercel
- [ ] Monitor for 24 hours
- [ ] Decommission WordPress (after 30 days)

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** support@vercel.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
