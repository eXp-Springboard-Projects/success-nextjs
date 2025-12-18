# SUCCESS.com Deployment Quick Start Guide

🚀 **Fast track to test deployment**

---

## ⚡ Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database set up
- [ ] Vercel account created
- [ ] GitHub repository ready

---

## 🔑 Step 1: Environment Variables (5 minutes)

### Generate Production Secret
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### Required Variables
Create `.env.local` or configure in Vercel:

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth (CRITICAL - use generated secret above!)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://www.success.com"

# WordPress
WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"
NEXT_PUBLIC_WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"
```

---

## 🗄️ Step 2: Database Setup (5 minutes)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed initial admin user
npx prisma db seed
```

### Create Admin User Manually
```bash
# Using Prisma Studio
npx prisma studio

# Or via SQL:
# Password: "admin123" (change immediately!)
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  'admin001',
  'Admin User',
  'admin@success.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);
```

---

## ✅ Step 3: Test Build (2 minutes)

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

Visit http://localhost:3000 to verify

---

## 🚀 Step 4: Deploy to Vercel (10 minutes)

### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option B: Vercel Dashboard
1. Import GitHub repository
2. Add environment variables
3. Deploy

### Environment Variables to Configure in Vercel:
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
WORDPRESS_API_URL
NEXT_PUBLIC_WORDPRESS_API_URL
```

---

## 🔒 Step 5: Verify Security (5 minutes)

- [ ] Try accessing `/admin` without logging in → Should redirect to `/admin/login`
- [ ] Log in with admin credentials
- [ ] Verify admin dashboard loads
- [ ] Try accessing `/admin` as non-admin → Should work
- [ ] Log out and verify redirect

---

## 📊 Step 6: Quick Smoke Test (5 minutes)

### Public Routes
- [ ] Homepage: `/`
- [ ] Blog post: `/blog/[any-slug]`
- [ ] Category: `/category/business`
- [ ] Contact: `/contact`

### Admin Routes (After Login)
- [ ] Dashboard: `/admin`
- [ ] Posts: `/admin/posts`
- [ ] Settings: `/admin/settings`

### APIs
- [ ] RSS Feed: `/api/rss`
- [ ] Sitemap: `/api/sitemap.xml`
- [ ] Contact form: Submit test message

---

## 🎯 Step 7: Internal Testing (Ongoing)

### Create Test Document
Use this template in Notion/Coda:

**Route Checklist**
| Route | Status | Notes | Tester |
|-------|--------|-------|--------|
| Homepage | ⏳ | | |
| Blog Posts | ⏳ | | |
| Contact Form | ⏳ | | |
| Admin Login | ⏳ | | |
| Admin Dashboard | ⏳ | | |

**Bug Report Template**
- **Route/Feature:**
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Screenshot:**
- **Browser/Device:**
- **Severity:** Critical / High / Medium / Low

---

## 🚨 Common Issues & Quick Fixes

### Issue: Build fails with Prisma error
```bash
# Solution: Generate Prisma client
npx prisma generate
npm run build
```

### Issue: Admin redirect loop
```bash
# Solution: Check NEXTAUTH_SECRET is set correctly
echo $NEXTAUTH_SECRET

# Regenerate if needed
openssl rand -base64 32
```

### Issue: WordPress API not loading
```bash
# Solution: Test API directly
curl -s "https://www.success.com/wp-json/wp/v2/posts?per_page=1"

# Check environment variable
echo $NEXT_PUBLIC_WORDPRESS_API_URL
```

### Issue: Database connection error
```bash
# Solution: Verify DATABASE_URL format
# Should be: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Test connection
npx prisma db push --skip-generate
```

---

## 📢 Step 8: Announce to Team (2 minutes)

### Slack Message Template
```
🚀 **SUCCESS.com Test Deployment is LIVE!**

We're ready for internal testing before public launch.

**Test Site:** [your-deployment-url]
**Test Doc:** [Notion/Coda link]
**Admin Login:** admin@success.com (DM me for password)

**What to Test:**
✅ Browse homepage and articles
✅ Try search and navigation
✅ Submit contact form
✅ Test admin dashboard (if you have access)

**Timeline:**
- Testing Phase: [Start Date] - [End Date]
- Bug triage: Daily standup
- Feedback due: [Date]

Please log any issues in the test doc. Questions? Drop them in #success-web

Thanks team! 🙌
```

---

## 🎁 Bonus: Production Checklist

Before going fully public:

- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Google Analytics added
- [ ] Stripe configured (if payments enabled)
- [ ] SMTP configured (if email enabled)
- [ ] Error monitoring (Sentry, etc.)
- [ ] Performance testing (Lighthouse score >90)
- [ ] SEO audit complete
- [ ] Legal pages reviewed (Privacy, Terms)
- [ ] Mobile responsive verified
- [ ] Cross-browser testing done

---

## 📞 Need Help?

- **Full Checklist:** See `DEPLOYMENT_CHECKLIST.md`
- **Environment Variables:** See `.env.production.example`
- **Stripe Setup:** See Stripe section in full checklist
- **Vercel Docs:** https://vercel.com/docs

---

**Estimated Total Time:** 30-40 minutes

**Status After Completion:** Ready for internal testing ✅
