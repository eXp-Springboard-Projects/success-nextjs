# Staging Deployment Guide

**Deploy SUCCESS Magazine Admin to Vercel Staging**

This guide covers deploying the application to a staging environment for staff testing.

---

## Prerequisites

- [ ] Vercel account with SUCCESS Magazine project
- [ ] Database provisioned (Vercel Postgres or Neon)
- [ ] Domain ready (staging.success.com or staff-test.success.com)
- [ ] Sample content imported locally and tested

---

## Step 1: Prepare Environment Variables

Create environment variables in Vercel dashboard for staging:

### Required Variables

```bash
# Database (Vercel Postgres or Neon)
DATABASE_URL="postgres://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://staging.success.com"
NEXTAUTH_SECRET="[Generate 32+ char random string]"

# WordPress API
NEXT_PUBLIC_WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"
WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"

# Stripe (Use TEST keys for staging)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Use test email service)
EMAIL_SERVER_HOST="smtp.mailtrap.io"
EMAIL_SERVER_PORT="2525"
EMAIL_SERVER_USER="[mailtrap_user]"
EMAIL_SERVER_PASSWORD="[mailtrap_password]"
EMAIL_FROM="noreply@staging.success.com"

# Paykickstart (Optional - use test account)
PAYKICKSTART_API_KEY="[test_key]"
PAYKICKSTART_WEBHOOK_SECRET="[test_secret]"
```

### Generate NEXTAUTH_SECRET

```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

---

## Step 2: Configure Vercel Project

### Option A: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Create New Project**
   - Import from GitHub
   - Select `success-next` repository
   - Choose `main` branch

3. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables listed above
   - Select "Preview" environment for staging

5. **Configure Domain**
   - Go to Settings → Domains
   - Add custom domain: `staging.success.com`
   - Configure DNS (CNAME or A record)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
# (Enter value when prompted)
# Repeat for all environment variables

# Deploy to preview (staging)
vercel --prod
```

---

## Step 3: Initialize Database

Once deployed, run Prisma migrations on staging database:

```bash
# Set DATABASE_URL for staging
export DATABASE_URL="[staging_database_url]"

# Run migrations
npx prisma migrate deploy

# Or use Vercel CLI
vercel env pull .env.staging
DATABASE_URL=$(grep DATABASE_URL .env.staging | cut -d '=' -f2) npx prisma migrate deploy
```

---

## Step 4: Import Sample Content

### Option A: Import from Local Script

```bash
# Set staging database URL
export DATABASE_URL="[staging_database_url]"

# Create staff accounts
npx tsx scripts/create-staff-accounts.ts

# Import sample content from WordPress
npx tsx scripts/import-sample-content.ts
```

### Option B: Import via Production Snapshot

```bash
# Dump local database
pg_dump $LOCAL_DATABASE_URL > sample_data.sql

# Restore to staging
psql $STAGING_DATABASE_URL < sample_data.sql
```

---

## Step 5: Verify Deployment

### Test Checklist

- [ ] **Homepage loads** - Visit https://staging.success.com
- [ ] **Login works** - Go to /admin/login
- [ ] **Staff accounts work** - Test all 5 accounts
- [ ] **Posts list loads** - Go to /admin/posts
- [ ] **Media library works** - Test image upload
- [ ] **Create new post** - Test full editor
- [ ] **Bulk actions work** - Test bulk publish/delete
- [ ] **Search works** - Search posts
- [ ] **Filters work** - Filter by author/status/category
- [ ] **Quick edit works** - Test inline editing

### Test Login with Each Account

```
Admin:       admin@success.com / Success2025!
Editor:      editor@success.com / Success2025!
Author 1:    author1@success.com / Success2025!
Author 2:    author2@success.com / Success2025!
Contributor: contributor@success.com / Success2025!
```

---

## Step 6: Configure DNS

### For staging.success.com

**Option A: CNAME (Recommended)**
```
Type:  CNAME
Name:  staging
Value: cname.vercel-dns.com
TTL:   Auto
```

**Option B: A Record**
```
Type:  A
Name:  staging
Value: 76.76.21.21 (Vercel's IP)
TTL:   Auto
```

### Verify DNS Propagation

```bash
# Check DNS
dig staging.success.com

# Or use online tool
# https://dnschecker.org/
```

---

## Step 7: Enable HTTPS

Vercel automatically provisions SSL certificates via Let's Encrypt.

**Verify HTTPS:**
1. Wait 2-5 minutes after DNS propagation
2. Visit https://staging.success.com
3. Check for padlock icon in browser

**Force HTTPS:**
- Vercel automatically redirects HTTP → HTTPS
- No additional configuration needed

---

## Step 8: Set Up Monitoring

### Vercel Analytics

1. Go to Vercel Dashboard → Analytics
2. Enable Web Analytics
3. Enable Speed Insights

### Error Tracking (Optional)

Add Sentry for error monitoring:

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

Add to environment variables:
```
NEXT_PUBLIC_SENTRY_DSN="[your_sentry_dsn]"
```

---

## Step 9: Send Credentials to Staff

### Email Template

```
Subject: SUCCESS Magazine Admin - Staging Access

Hi Team,

The new SUCCESS Magazine admin system is ready for testing!

🔗 STAGING URL
https://staging.success.com/admin

👤 YOUR CREDENTIALS
Email:    [staff_email]
Password: Success2025!

⚠️  IMPORTANT
- This is STAGING environment - not production
- Test data only - not real content
- Change your password after first login
- Report any issues via Slack #admin-feedback

📋 TESTING FOCUS AREAS
1. Login and navigation
2. Create/edit posts
3. Upload images (via library and drag-drop)
4. Bulk actions (publish, delete, etc.)
5. Search and filter posts
6. Quick edit inline
7. Media library management

🗓️ TESTING TIMELINE
- Testing Period: [Date] - [Date] (3-5 days)
- Daily standup: 10am in #admin-feedback
- Feedback deadline: [Date]

📚 DOCUMENTATION
- Feature guide: https://staging.success.com/docs
- Video tutorial: [link]
- Slack channel: #admin-feedback

Questions? Reply to this email or ping @admin-team in Slack.

Thanks!
[Your Name]
```

### Secure Credential Sharing

**DO NOT** send passwords via email. Use one of these methods:

1. **Password Manager** (Best)
   - 1Password team vault
   - LastPass shared folder

2. **Temporary Sharing Service**
   - https://onetimesecret.com/
   - https://privnote.com/

3. **In-Person** (Most Secure)
   - Share passwords verbally or on paper
   - Staff changes password immediately

---

## Step 10: Monitor During Testing

### Daily Checks

```bash
# Check deployment status
vercel ls

# View recent logs
vercel logs [deployment-url]

# Check build errors
vercel inspect [deployment-url]
```

### Monitor These Metrics

- **Page Load Time** - Should be < 3 seconds
- **Error Rate** - Should be < 1%
- **API Response Time** - Should be < 500ms
- **Failed Logins** - Monitor for issues
- **Upload Success Rate** - Media uploads working

### Vercel Dashboard Monitoring

1. Go to https://vercel.com/dashboard
2. Select project
3. Click "Analytics" tab
4. Monitor:
   - Traffic
   - Performance
   - Errors
   - Web Vitals

---

## Troubleshooting

### Build Failures

**Error: Database connection failed**
```bash
# Verify DATABASE_URL is set
vercel env ls

# Test connection locally
DATABASE_URL="[staging_url]" npx prisma db pull
```

**Error: Module not found**
```bash
# Clear build cache
vercel --force

# Or in dashboard: Settings → Clear Build Cache
```

**Error: TypeScript errors**
```bash
# Run type check locally
npm run build

# Fix errors and redeploy
```

### Runtime Errors

**500 Internal Server Error**
- Check Vercel logs: `vercel logs`
- Check environment variables
- Verify database connection

**404 Not Found**
- Check route files exist
- Verify build output
- Check middleware configuration

**Authentication Not Working**
- Verify NEXTAUTH_URL is correct
- Check NEXTAUTH_SECRET is set
- Test database connection
- Verify users table populated

### Performance Issues

**Slow Page Loads**
- Enable Vercel Speed Insights
- Check database query performance
- Optimize images (use Next.js Image component)
- Enable caching headers

**Database Timeout**
- Check connection pool settings
- Optimize slow queries
- Add database indexes
- Consider upgrading database plan

---

## Rollback Plan

If critical issues occur:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via dashboard
# Go to Deployments → Click ... → Promote to Production
```

---

## Post-Deployment Checklist

- [ ] Staging URL accessible (https://staging.success.com)
- [ ] HTTPS working (valid SSL certificate)
- [ ] Database migrations completed
- [ ] Sample content imported (100-200 posts)
- [ ] All 5 staff accounts created
- [ ] All 5 staff accounts tested (can login)
- [ ] Media upload working
- [ ] Post creation working
- [ ] Bulk actions working
- [ ] Search/filters working
- [ ] Email sent to staff with credentials
- [ ] Monitoring enabled (Vercel Analytics)
- [ ] Error tracking configured (optional)
- [ ] Feedback channel created (#admin-feedback)
- [ ] Testing timeline communicated to team

---

## Staff Testing Schedule

### Week 1: Initial Testing (3-5 days)

**Day 1:**
- Staff receives credentials
- Login and navigation testing
- Basic post creation

**Day 2:**
- Media library testing
- Image upload (library + drag-drop)
- Featured image setting

**Day 3:**
- Bulk actions testing
- Search and filters
- Quick edit

**Day 4:**
- Advanced features
- SEO fields
- Categories/tags
- Post revisions

**Day 5:**
- Bug fixes from feedback
- Retest critical flows
- Collect final feedback

### Daily Standup (10am)

- What did you test yesterday?
- What issues did you find?
- What will you test today?
- Any blockers?

### Feedback Collection

**Methods:**
- Slack channel: #admin-feedback
- Google Form: [link]
- Bug tracker: Linear/Jira/GitHub Issues
- Daily standup notes

**Categories:**
- 🐛 Bug (something broken)
- 💡 Feature Request (nice to have)
- 🎨 UI/UX Feedback (design/usability)
- 📚 Documentation (unclear/missing docs)
- ⚡ Performance (slow/laggy)

---

## Success Criteria

Staff testing is successful when:

- [ ] All 5 staff can login and navigate
- [ ] 100% can create/edit posts
- [ ] 100% can upload images
- [ ] 100% can use bulk actions
- [ ] 100% can search/filter posts
- [ ] <5 critical bugs found
- [ ] <10 minor bugs found
- [ ] 80%+ staff satisfaction score
- [ ] All critical bugs fixed
- [ ] Ready for production deployment

---

## Next Steps After Testing

1. **Fix Critical Bugs** - Address P0 issues immediately
2. **Prioritize Features** - Decide which requests make launch cut
3. **Plan Production Migration** - Full WordPress content import
4. **Schedule Production Deploy** - Pick go-live date
5. **Production Accounts** - Create real staff accounts with strong passwords
6. **Final Security Audit** - Penetration testing, code review
7. **Performance Optimization** - Load testing, caching strategy
8. **Documentation** - Staff training materials, user guides
9. **Launch Plan** - Cutover strategy, rollback plan

---

## Support Contacts

**Technical Issues:**
- Developer: [email]
- Slack: #admin-dev-support

**Access Issues:**
- IT Admin: [email]
- Slack: #it-help

**General Questions:**
- Project Manager: [email]
- Slack: #admin-general

---

## Additional Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Project README:** See README.md in repo
- **Architecture Docs:** See ARCHITECTURE.md
- **API Documentation:** See API_REFERENCE.md
