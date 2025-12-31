# SUCCESS.com Deployment Readiness Checklist

**Goal:** Go live in test mode, with safe infrastructure and internal feedback loop

**Status:** In Progress
**Last Updated:** 2025-01-12
**Deployment Target:** Test Mode (Internal Access Only)

---

## 🔒 Access & Security

### Authentication & Authorization

- [x] **NextAuth configured** - JWT-based session authentication
- [x] **Middleware protection** - All `/admin/*` routes require authentication
- [x] **Role-based access control** - SUPER_ADMIN, ADMIN, EDITOR, AUTHOR roles defined
- [ ] **Generate production NEXTAUTH_SECRET** - Replace placeholder with secure random string
  ```bash
  # Generate a new secret for production:
  openssl rand -base64 32
  ```
- [ ] **Review admin user accounts** - Ensure only authorized users have access
- [ ] **Enable rate limiting** - Protect login endpoint from brute force attacks
- [ ] **Set up IP whitelist (optional)** - For additional security during test phase

### Environment Variables

**Required for Production:**
- [ ] `NEXTAUTH_SECRET` - Strong random string for JWT signing
- [ ] `NEXTAUTH_URL` - Production URL (https://www.success.com)
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `WORDPRESS_API_URL` - WordPress REST API endpoint
- [ ] `NEXT_PUBLIC_WORDPRESS_API_URL` - Client-side API URL

**Optional:**
- [ ] `STRIPE_SECRET_KEY` - For payment processing
- [ ] `STRIPE_PUBLISHABLE_KEY` - For client-side Stripe
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - For email notifications

---

## 📄 Content & CMS

### Content Review

- [x] **Homepage** - Multi-section layout with featured content
- [x] **Article templates** - Blog post pages with author bio, sharing, related posts
- [x] **Category pages** - Archive pages with pagination
- [x] **Author pages** - Profile pages with bio and article listings
- [x] **Static pages** - About, Contact, Magazine, Subscribe, etc.
- [ ] **Proofread all content** - Review copy on static pages
- [ ] **Test all internal links** - Ensure no broken links
- [ ] **Verify images load** - Check featured images and media

### WordPress Integration

- [x] **WordPress API client** - `lib/wordpress.js` configured
- [x] **ISR enabled** - Pages regenerate every 10 minutes
- [ ] **Confirm API access** - Test WordPress API availability
- [ ] **WordPress content snapshot** - Document current state before migration
- [ ] **Plan content freeze** - Coordinate with publishing team

### Content Management

- [x] **Admin dashboard** - Content management interface
- [x] **WordPress sync tool** - Import content from WordPress
- [x] **Content viewer** - Preview WordPress content
- [ ] **Editor training** - Document CMS workflow for team
- [ ] **Content approval process** - Define publishing workflow

---

## 💳 Payments & Stripe

### Stripe Setup

- [ ] **Create Stripe account** - Set up production account
- [ ] **Configure products** - SUCCESS+ membership tiers
  - [ ] Monthly subscription ($X/month)
  - [ ] Annual subscription ($X/year)
  - [ ] Magazine-only option
- [ ] **Set up webhooks** - Handle subscription events
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] **Test mode integration** - Use Stripe test keys first
- [ ] **Build checkout UI** - Subscription purchase flow
- [ ] **Create pricing page** - `/subscribe` or `/pricing`
- [ ] **Member dashboard** - View subscription status
- [ ] **Webhook endpoint** - `/api/webhooks/stripe`

### Database Schema for Subscriptions

```sql
-- Add to Prisma schema
model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  stripeCustomerId  String?  @unique
  stripeSubscriptionId String? @unique
  stripePriceId     String?
  status            SubscriptionStatus @default(INACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}
```

### eXp Engineer Coordination

- [ ] **Payment routing review** - Confirm secure payment handling
- [ ] **PCI compliance** - Ensure no credit card data stored locally
- [ ] **Error handling** - Payment failures gracefully handled
- [ ] **Refund process** - Document refund workflow

---

## 🧪 Internal Testing Prep

### Test Routes & Functionality

**Public Routes:**
- [ ] Homepage (`/`)
- [ ] Blog posts (`/blog/[slug]`)
- [ ] Categories (`/category/[slug]`)
- [ ] Authors (`/author/[slug]`)
- [ ] Static pages (`/about`, `/contact`, `/magazine`, etc.)
- [ ] Search functionality
- [ ] Newsletter signup
- [ ] Contact form submission

**Admin Routes (Authenticated):**
- [ ] Admin dashboard (`/admin`)
- [ ] Posts management (`/admin/posts`)
- [ ] Pages management (`/admin/pages`)
- [ ] Media library (`/admin/media`)
- [ ] User management (`/admin/users`)
- [ ] Settings (`/admin/settings`)
- [ ] Analytics (`/admin/analytics`)
- [ ] WordPress sync (`/admin/wordpress-sync`)

**Payment Flow (When Implemented):**
- [ ] Pricing/Subscribe page
- [ ] Checkout process
- [ ] Payment confirmation
- [ ] Member dashboard
- [ ] Subscription management

### Testing Documentation

**Create test document in Notion/Coda with:**
- [ ] Route checklist (copy list above)
- [ ] Pass/fail checkpoints for each route
- [ ] Bug reporting fields:
  - Route/feature affected
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots
  - Browser/device info
  - Severity (Critical/High/Medium/Low)
- [ ] Feedback collection:
  - Design/UX feedback
  - Content feedback
  - Performance notes
  - Feature requests

### Test Team

**Identify testers:**
- [ ] Glenn (Leadership review)
- [ ] Kerrie (Publishing workflow)
- [ ] Publishing team (Content management)
- [ ] Tech team (Technical validation)
- [ ] CX team (User experience)

**Testing phases:**
1. **Phase 1: Smoke test** (1-2 testers, 1 day)
   - Basic functionality
   - Critical paths
   - Blocker issues

2. **Phase 2: Full test** (All testers, 3-5 days)
   - Complete checklist
   - Edge cases
   - Cross-browser testing

3. **Phase 3: Feedback review** (1 day)
   - Triage issues
   - Prioritize fixes
   - Plan next iteration

---

## 📣 Communication

### Pre-Deployment

- [ ] **Slack announcement draft**:
  ```
  🚀 SUCCESS.com Test Deployment

  We're going live with the new SUCCESS.com in TEST MODE!

  🔗 URL: [staging URL or test subdomain]
  📋 Test Doc: [Notion/Coda link]
  🎯 Goal: Internal feedback before public launch

  What's working:
  ✅ Homepage with featured content
  ✅ Article pages with full functionality
  ✅ Admin dashboard for content management
  ✅ WordPress content integration
  ✅ Newsletter signup

  What's not ready yet:
  ⏳ Payment/subscription flow (placeholder)
  ⏳ Video/podcast sections (coming next)
  ⏳ Mobile app integration

  Please test and share feedback in #success-web by [date].

  cc: @glenn @kerrie @publishing-team
  ```

- [ ] **Leadership brief** - "What's working, what's not yet"
  - Document feature completion status
  - Known issues/limitations
  - Timeline for remaining work
  - Risk assessment

- [ ] **Technical handoff** - Documentation for maintenance team
  - Deployment guide
  - Environment variables
  - Database migrations
  - Troubleshooting guide

### Post-Deployment

- [ ] **Launch announcement** - Slack message when live
- [ ] **Daily standup updates** - Progress on feedback items
- [ ] **Bug triage meetings** - Review and prioritize fixes
- [ ] **Feedback summary** - Weekly digest of learnings

---

## 🚀 Deployment Steps

### Pre-Deployment

1. [ ] Run final build locally: `npm run build`
2. [ ] Check for build errors or warnings
3. [ ] Run type checking: `npx tsc --noEmit`
4. [ ] Test production build locally: `npm start`
5. [ ] Review all environment variables
6. [ ] Database migrations ready: `npx prisma migrate deploy`
7. [ ] Backup production database (if applicable)

### Deployment (Vercel)

1. [ ] Connect GitHub repository to Vercel
2. [ ] Configure environment variables in Vercel dashboard
3. [ ] Set up production domain
4. [ ] Enable automatic deployments from main branch
5. [ ] Deploy: `vercel --prod` or push to main
6. [ ] Monitor deployment logs for errors
7. [ ] Run post-deployment checks

### Post-Deployment

1. [ ] Smoke test critical paths on production
2. [ ] Check error monitoring (Vercel logs, Sentry, etc.)
3. [ ] Verify SSL certificate is active
4. [ ] Test admin login on production
5. [ ] Send test email/contact form submission
6. [ ] Check sitemap: `/api/sitemap.xml`
7. [ ] Check RSS feed: `/api/rss`
8. [ ] Monitor server performance
9. [ ] Send launch announcement

---

## 📊 Success Metrics

**For Test Phase:**
- [ ] All critical routes accessible (100% uptime goal)
- [ ] Average page load time < 3 seconds
- [ ] Zero critical bugs after Phase 1
- [ ] At least 80% positive feedback on UX
- [ ] Content management workflow validated by publishing team

**For Public Launch:**
- [ ] Payment flow tested with real transactions
- [ ] Mobile responsiveness confirmed across devices
- [ ] SEO optimizations verified (meta tags, structured data)
- [ ] Analytics tracking working (Google Analytics, etc.)
- [ ] Performance benchmarks met (Lighthouse score >90)

---

## ⚠️ Known Issues / Limitations

_Document any known issues that won't be fixed before test deployment:_

1. **Database migrations** - Settings and subscription tables need migration
   - Run: `npx prisma migrate dev --name add_subscriptions`

2. **Payment flow** - Not yet implemented
   - Placeholder pages ready
   - Stripe integration planned for next phase

3. **Video/Podcast sections** - Limited functionality
   - Pages exist but need more testing
   - Content import from WordPress pending

4. **Email notifications** - SMTP not configured
   - Contact form logs but doesn't send email
   - Newsletter signup saves to database only

---

## 🎯 Next Steps After Test Deployment

1. **Review feedback** (Week 1)
2. **Fix critical bugs** (Week 1-2)
3. **Implement payment flow** (Week 2-3)
4. **Second test round** (Week 3)
5. **Prepare for public launch** (Week 4)
6. **Go live!** (TBD)

---

## 📞 Support Contacts

- **Tech Lead:** [Name/Email]
- **Project Manager:** [Name/Email]
- **eXp Engineer:** [Name/Email]
- **DevOps:** [Name/Email]
- **Vercel Support:** https://vercel.com/support

---

**Last Review:** 2025-01-12
**Next Review:** [Schedule review after Phase 1 testing]
