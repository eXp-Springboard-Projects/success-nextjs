# Quick Start: Staff Testing Setup

**Deploy to staging and start testing in 30 minutes**

---

## TL;DR - Run These Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Set staging database URL
export DATABASE_URL="your_staging_database_url"

# 3. Run migrations
npx prisma migrate deploy

# 4. Create staff accounts (5 users)
npx tsx scripts/create-staff-accounts.ts

# 5. Import sample content (100-200 posts)
npx tsx scripts/import-sample-content.ts

# 6. Deploy to Vercel
vercel --prod

# Done! ✅
```

---

## Step-by-Step Guide

### Step 1: Vercel Deployment (10 min)

**Option A: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import from GitHub → select `success-next`
4. Configure:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables (see below)
6. Click "Deploy"

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 2: Environment Variables (5 min)

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Required
DATABASE_URL="postgres://user:pass@host:5432/db?sslmode=require"
NEXTAUTH_URL="https://staging.success.com"
NEXTAUTH_SECRET="[run: openssl rand -base64 32]"

# WordPress (read-only)
NEXT_PUBLIC_WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"

# Optional - Stripe TEST keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

### Step 3: Database Setup (5 min)

```bash
# Set database URL (from Vercel or Neon)
export DATABASE_URL="your_postgres_url"

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### Step 4: Import Content (5 min)

```bash
# Create staff accounts
npx tsx scripts/create-staff-accounts.ts

# Import sample posts
npx tsx scripts/import-sample-content.ts
```

**Expected output:**
```
✅ Created: 5 staff accounts
✅ Imported: 100-200 posts
✅ Imported: 50+ categories
✅ Imported: 20+ authors
```

### Step 5: Verify & Test (5 min)

1. Visit: https://staging.success.com
2. Login: admin@success.com / Success2025!
3. Check:
   - ✅ Dashboard loads
   - ✅ Posts list shows 100+ posts
   - ✅ Media library has images
   - ✅ Can create new post
   - ✅ All 5 accounts work

---

## Staff Credentials

**Send to staff via secure method (NOT email):**

```
Admin:       admin@success.com       / Success2025!
Editor:      editor@success.com      / Success2025!
Author 1:    author1@success.com     / Success2025!
Author 2:    author2@success.com     / Success2025!
Contributor: contributor@success.com / Success2025!
```

**Share via:**
- 1Password team vault (best)
- https://onetimesecret.com/ (good)
- In-person (most secure)

---

## Testing Schedule

### Week 1: Deployment
- **Monday:** Deploy to staging ✅
- **Tuesday:** Import content, create accounts ✅
- **Wednesday:** Send credentials, orientation 🎯

### Week 2: Testing (5 days)
- **Day 1:** Login, navigation, basic posts
- **Day 2:** Media library, image uploads
- **Day 3:** Advanced features, publishing
- **Day 4:** Bulk actions, search, filters
- **Day 5:** Bug fixes, final feedback

### Week 3: Review
- Fix critical bugs
- Prioritize features
- Production readiness review

---

## Daily Standup (10am)

**In Slack #admin-feedback:**
- What did you test yesterday?
- What issues did you find?
- What will you test today?
- Any blockers?

---

## Report Issues

**Slack:** #admin-feedback
**Bug Form:** [insert Google Form]
**Email:** dev@success.com

**Priority:**
- 🔴 Critical: Cannot login, data loss, complete failure
- 🟡 Major: Feature broken, poor performance
- 🟢 Minor: Cosmetic, nice-to-have

---

## Testing Checklist

Give each tester a copy of: `STAFF_TESTING_CHECKLIST.md`

**5-Day Plan:**
1. ✅ Login & Navigation
2. ✅ Create Posts & Save Drafts
3. ✅ Media Library & Image Uploads
4. ✅ Advanced Features & Publishing
5. ✅ Bulk Actions, Search, Filters

---

## Success Criteria

Testing complete when:
- [ ] All 5 staff can login
- [ ] 100% can create/edit posts
- [ ] 100% can upload images
- [ ] 100% can use bulk actions
- [ ] <5 critical bugs
- [ ] 80%+ satisfaction
- [ ] Ready for production ✅

---

## Quick Reference

### Scripts Location
```
scripts/
  ├── create-staff-accounts.ts    # Create 5 test users
  └── import-sample-content.ts    # Import 100-200 posts
```

### Documentation
```
STAFF_BLOCKERS_RESOLVED.md        # What was fixed
STAGING_DEPLOYMENT_GUIDE.md       # Full deployment guide
STAFF_TESTING_CHECKLIST.md        # Testing procedures
STAFF_TESTING_READINESS.md        # Full readiness report
QUICK_START_STAFF_TESTING.md      # This file
```

### Key URLs
- Staging: https://staging.success.com
- Admin: https://staging.success.com/admin
- Vercel: https://vercel.com/dashboard
- Slack: #admin-feedback

---

## Troubleshooting

**Build fails:**
```bash
# Clear cache
vercel --force

# Check logs
vercel logs
```

**Can't login:**
```bash
# Recreate accounts
npx tsx scripts/create-staff-accounts.ts

# Check database
npx prisma studio
```

**No posts showing:**
```bash
# Re-import
npx tsx scripts/import-sample-content.ts

# Verify
npx prisma studio
```

**Deployment URL wrong:**
- Go to Vercel → Settings → Domains
- Add: staging.success.com
- Update DNS: CNAME → cname.vercel-dns.com

---

## Support

**Technical Issues:**
- Developer: [email]
- Slack: #admin-dev-support

**Access Issues:**
- IT Admin: [email]
- Slack: #it-help

**Questions:**
- PM: [email]
- Slack: #admin-general

---

## Next Steps After Testing

1. Fix critical bugs (P0)
2. Address major issues (P1)
3. Plan production migration
4. Create real staff accounts
5. Full WordPress content import (2,000+ posts)
6. Production deployment
7. Go live! 🚀

---

**Questions?** Check `STAGING_DEPLOYMENT_GUIDE.md` for full details.

**Ready?** Let's test! 🎉
