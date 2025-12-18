# Essential Features Documentation

Complete documentation for all essential platform features including e-commerce, memberships, newsletter, and testing.

## Table of Contents

1. [E-Commerce & Payments](#e-commerce--payments)
2. [Membership Tiers](#membership-tiers)
3. [Content Gating](#content-gating)
4. [Newsletter Integration](#newsletter-integration)
5. [Testing Guide](#testing-guide)
6. [Environment Setup](#environment-setup)

---

## E-Commerce & Payments

### Supported Payment Providers

1. **Stripe** (Primary)
   - Checkout sessions for subscriptions
   - Webhook handling
   - Customer portal
   - Location: `pages/api/stripe/*`, `lib/stripe.js`

2. **PayKickstart** (Alternative)
   - Webhook integration
   - Subscription management
   - Location: `pages/api/paykickstart/webhook.ts`

### Payment Flows

#### 1. Stripe Checkout Flow

```javascript
// Client-side: Initiate checkout
const response = await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'collective', // or 'insider'
    billingCycle: 'monthly', // or 'annual'
    successUrl: window.location.origin + '/subscribe/success',
    cancelUrl: window.location.origin + '/subscribe',
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

#### 2. Webhook Processing

**Stripe webhooks** are handled automatically at `/api/stripe/webhooks`
**PayKickstart webhooks** are handled at `/api/paykickstart/webhook`

Both update the database:
- Create/update `subscriptions` record
- Update user `subscriptionStatus`
- Log activity in `activity_logs`

### Shopping Cart

No dedicated shopping cart implemented yet. The platform uses direct checkout for subscriptions.

**To add shopping cart:**
1. Create `cart` table in schema
2. Add cart API endpoints
3. Build cart UI component
4. Integrate with checkout flow

---

## Membership Tiers

### Available Tiers

| Tier | Monthly Price | Annual Price | Features |
|------|--------------|--------------|----------|
| **FREE** | $0 | $0 | 3 articles/month, Newsletter |
| **COLLECTIVE** | $24.99 | $209 | Unlimited articles, 100+ courses, Digital magazine, Mobile app |
| **INSIDER** | $64.99 | $545 | Everything in Collective + Print magazine, Exclusive content, Live Q&A, Coaching |

### Implementation

**Location:** `lib/membership.ts`

**Key Functions:**

```typescript
// Get user's current tier
const tier = await getUserTier(userId);

// Check feature access
const hasAccess = await hasFeatureAccess(userId, 'coursesAccess');

// Check content access
const { canAccess, reason, requiredTier } = await canAccessContent(userId, content);

// Track article views (for paywall)
await trackArticleView(userId, article);
```

### Tier Features Matrix

```typescript
TIER_FEATURES = {
  FREE: {
    articlesPerMonth: 3,
    magazineAccess: false,
    coursesAccess: false,
    livesAccess: false,
    printMagazine: false,
    coaching: false,
  },
  COLLECTIVE: {
    articlesPerMonth: Infinity,
    magazineAccess: true,
    coursesAccess: true,
    livesAccess: false,
    printMagazine: false,
    coaching: false,
  },
  INSIDER: {
    articlesPerMonth: Infinity,
    magazineAccess: true,
    coursesAccess: true,
    livesAccess: true,
    printMagazine: true,
    coaching: true,
  },
}
```

---

## Content Gating

### How It Works

1. **Tag-based gating:** Articles tagged with `success-plus`, `premium`, or `exclusive` are gated
2. **Category-based gating:** Categories like `insider`, `exclusive`, `premium` trigger paywall
3. **Insider-only flag:** Explicit `isInsiderOnly` field for Insider tier content
4. **Article limits:** Free users limited to 3 articles/month

### Implementation

**PaywallGate Component:**

```tsx
import PaywallGate from '../components/PaywallGate';

<PaywallGate
  articleId={post.id}
  articleTitle={post.title}
  articleUrl={`/blog/${post.slug}`}
  categories={post.categories}
  tags={post.tags}
  isInsiderOnly={false}
  showPreview={true}
>
  {/* Article content here */}
  <div dangerouslySetInnerHTML={{ __html: post.content }} />
</PaywallGate>
```

**API Endpoint:**

```typescript
// Check if user can access content
POST /api/content/check-access

// Request body
{
  contentId: "post-123",
  contentSlug: "article-slug",
  title: "Article Title",
  url: "/blog/article-slug",
  categories: [{ slug: "business" }],
  tags: [{ slug: "success-plus" }],
  isInsiderOnly: false
}

// Response
{
  canAccess: false,
  reason: "article_limit_reached",
  requiredTier: "COLLECTIVE"
}
```

### Paywall Configuration

Admin can configure paywall settings in database:

```sql
SELECT * FROM paywall_config;
```

Fields:
- `freeArticleLimit` - Number of free articles per month (default: 3)
- `resetPeriodDays` - Days before limit resets (default: 30)
- `enablePaywall` - Enable/disable paywall globally
- `bypassedCategories` - Category slugs to bypass paywall
- `bypassedArticles` - Article IDs to bypass paywall
- `popupTitle`, `popupMessage`, `ctaButtonText` - Customizable UI text

---

## Newsletter Integration

### Supported Providers

1. **ConvertKit** (Recommended)
2. **Mailchimp**
3. **Database only** (fallback)

### Setup

**Environment Variables:**

```env
# ConvertKit
CONVERTKIT_API_KEY=your_api_key
CONVERTKIT_FORM_ID=your_form_id

# Mailchimp
MAILCHIMP_API_KEY=your_api_key
MAILCHIMP_AUDIENCE_ID=your_audience_id
MAILCHIMP_SERVER_PREFIX=us1
```

### API Endpoint

```typescript
POST /api/newsletter/subscribe

// Request
{
  email: "user@example.com",
  firstName: "John" // optional
}

// Response
{
  success: true,
  message: "Thanks for subscribing!",
  providers: {
    convertKit: true,
    mailchimp: true
  }
}
```

### Integration Flow

1. User submits email via newsletter form
2. API validates email
3. Checks for duplicate subscription
4. Adds to database (`newsletter_subscribers` table)
5. Syncs to ConvertKit (if configured)
6. Syncs to Mailchimp (if configured)
7. Creates CRM contact record
8. Returns success response

### Newsletter Subscriber Management

**Admin Dashboard:** `http://localhost:3000/admin/subscribers`

Features:
- View all subscribers
- Export to CSV
- Bulk actions (activate, unsubscribe)
- Filter by status
- Search by email

**Database Schema:**

```prisma
model newsletter_subscribers {
  id             String           @id
  email          String           @unique
  status         SubscriberStatus @default(ACTIVE)
  subscribedAt   DateTime         @default(now())
  unsubscribedAt DateTime?
}

enum SubscriberStatus {
  ACTIVE
  UNSUBSCRIBED
  BOUNCED
}
```

---

## Testing Guide

### Test Suites

#### 1. Payment Flows (`tests/integration/payment-flows.test.ts`)

Tests:
- ✓ Stripe checkout session creation
- ✓ PayKickstart webhook processing
- ✓ Subscription tier validation
- ✓ Content access control
- ✓ Newsletter signup

**Run:**
```bash
npm run test:integration
```

#### 2. Authentication Flows (`tests/integration/auth-flows.test.ts`)

Tests:
- ✓ User registration
- ✓ Login/logout
- ✓ Password reset
- ✓ Email verification
- ✓ Session management
- ✓ Role-based access

**Run:**
```bash
npm run test:auth
```

### Manual Testing Checklist

#### E-Commerce Testing

- [ ] **Checkout Flow (Collective Monthly)**
  1. Go to `/subscribe`
  2. Select "Collective" tier
  3. Choose "Monthly" billing
  4. Click "Subscribe"
  5. Complete Stripe checkout with test card: `4242 4242 4242 4242`
  6. Verify redirect to success page
  7. Check database for subscription record

- [ ] **Checkout Flow (Insider Annual)**
  1. Same as above with "Insider" and "Annual"

- [ ] **PayKickstart Webhook**
  1. Send test webhook to `/api/paykickstart/webhook`
  2. Verify subscription created in database
  3. Check user `subscriptionStatus` updated

- [ ] **Invalid Payment**
  1. Use test card `4000 0000 0000 0002` (decline)
  2. Verify error handling

#### Membership & Content Gating Testing

- [ ] **Free User - Article Limit**
  1. Create new user or use incognito
  2. Read 3 articles
  3. On 4th article, verify paywall appears
  4. Check "You've reached your limit" message

- [ ] **Collective User - Unlimited Access**
  1. Login as Collective member
  2. Read 10+ articles
  3. Verify no paywall
  4. Access digital magazine - should work
  5. Try to access Insider content - should be blocked

- [ ] **Insider User - Full Access**
  1. Login as Insider member
  2. Access all content types
  3. Verify Insider badge appears
  4. Check print magazine access

- [ ] **SUCCESS+ Tagged Content**
  1. Create post with tag `success-plus`
  2. View as non-member - should see paywall
  3. View as member - should see full content

#### Newsletter Testing

- [ ] **New Subscription**
  1. Submit email in newsletter form
  2. Verify success message
  3. Check database for record
  4. Verify email sent (if configured)

- [ ] **Duplicate Subscription**
  1. Submit same email again
  2. Verify "Already subscribed" message

- [ ] **Invalid Email**
  1. Submit `invalid-email`
  2. Verify error message

- [ ] **Unsubscribe**
  1. Click unsubscribe link in email
  2. Verify status changed to `UNSUBSCRIBED`

#### Authentication Testing

- [ ] **Registration**
  1. Register new user at `/auth/register`
  2. Verify account created
  3. Check email verification sent

- [ ] **Login**
  1. Login with credentials
  2. Verify redirect to dashboard/home
  3. Check session created

- [ ] **Password Reset**
  1. Click "Forgot password"
  2. Enter email
  3. Check reset email received
  4. Click reset link
  5. Set new password
  6. Login with new password

- [ ] **Email Verification**
  1. Click verification link in email
  2. Verify account activated
  3. Check `emailVerified` = true

### Test Data

**Test Cards (Stripe):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

**Test Users:**
```sql
-- Free user
INSERT INTO users (email, role, subscriptionStatus)
VALUES ('free@test.com', 'EDITOR', 'INACTIVE');

-- Collective user
INSERT INTO users (email, role, subscriptionStatus)
VALUES ('collective@test.com', 'EDITOR', 'ACTIVE');

-- Insider user
INSERT INTO users (email, role, subscriptionStatus)
VALUES ('insider@test.com', 'EDITOR', 'ACTIVE');
```

---

## Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# WordPress API (for content migration)
WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"

# Authentication (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_COLLECTIVE_MONTHLY="price_..."
STRIPE_PRICE_COLLECTIVE_ANNUAL="price_..."
STRIPE_PRICE_INSIDER_MONTHLY="price_..."
STRIPE_PRICE_INSIDER_ANNUAL="price_..."

# PayKickstart
PAYKICKSTART_API_KEY="your_api_key"
PAYKICKSTART_WEBHOOK_SECRET="your_webhook_secret"

# Newsletter - ConvertKit
CONVERTKIT_API_KEY="your_api_key"
CONVERTKIT_FORM_ID="your_form_id"

# Newsletter - Mailchimp (alternative)
MAILCHIMP_API_KEY="your_api_key"
MAILCHIMP_AUDIENCE_ID="your_audience_id"
MAILCHIMP_SERVER_PREFIX="us1"

# Email (optional)
SENDGRID_API_KEY="SG..."
SENDGRID_FROM_EMAIL="newsletter@success.com"
```

### Database Schema Updates

If schema has changed, run:

```bash
npx prisma db push
# or
npx prisma migrate dev --name feature_name
```

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Push database schema
npx prisma db push

# 4. Seed initial data (if seed file exists)
npx prisma db seed

# 5. Run development server
npm run dev

# 6. Access admin dashboard
# http://localhost:3000/admin
# Default login: admin@success.com / (check database)
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

### Payments
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/webhooks` - Stripe webhook handler
- `POST /api/paykickstart/webhook` - PayKickstart webhook handler

### Content & Membership
- `POST /api/content/check-access` - Check if user can access content
- `GET /api/paywall/config` - Get paywall configuration
- `POST /api/paywall/track` - Track article view for limits

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter

### Admin (requires authentication)
- `GET /api/admin/subscribers` - List all newsletter subscribers
- `POST /api/admin/subscribers/export` - Export subscribers to CSV
- `GET /api/admin/subscriptions` - List all subscriptions
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/[id]/role` - Update user role

---

## Deployment Checklist

### Pre-Launch

- [ ] Set all environment variables in production
- [ ] Configure Stripe webhooks to production URL
- [ ] Configure PayKickstart webhooks to production URL
- [ ] Test payment flow with live credentials
- [ ] Test newsletter signup
- [ ] Verify email sending works
- [ ] Test all authentication flows
- [ ] Check all API endpoints respond correctly
- [ ] Run full test suite
- [ ] Verify database migrations applied
- [ ] Set up database backups
- [ ] Configure monitoring (Sentry, LogRocket, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Test on mobile devices
- [ ] Verify SSL certificate
- [ ] Test all admin features
- [ ] Review security headers
- [ ] Enable rate limiting on APIs
- [ ] Document admin workflows
- [ ] Train staff on new system

### Post-Launch

- [ ] Monitor error logs
- [ ] Check payment webhook delivery
- [ ] Verify subscriptions syncing correctly
- [ ] Monitor newsletter signups
- [ ] Check user registration flow
- [ ] Monitor page load times
- [ ] Review security logs
- [ ] Verify backups running
- [ ] Test rollback procedure
- [ ] Update documentation with production URLs

---

## Support & Troubleshooting

### Common Issues

**1. Subscription not activating after payment**
- Check Stripe/PayKickstart webhook delivery logs
- Verify webhook secret is correct
- Check database `subscriptions` and `users` tables
- Review server logs for webhook errors

**2. Paywall not working**
- Check `paywall_config` table exists and has data
- Verify `/api/content/check-access` endpoint responding
- Check browser console for JavaScript errors
- Verify user session is valid

**3. Newsletter signup failing**
- Check environment variables set correctly
- Verify email provider API keys valid
- Check `newsletter_subscribers` table for record
- Review server logs for API errors

**4. Authentication errors**
- Verify `NEXTAUTH_SECRET` is set
- Check database sessions table
- Verify user exists in database
- Check password hash is valid

### Getting Help

- Review error logs in `/logs` directory
- Check browser console for client errors
- Review database tables for data issues
- Test APIs with Postman/curl
- Check environment variables are set

---

**Last Updated:** 2025-11-08
**Version:** 1.0
