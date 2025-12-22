# 🚨 THIS WEEK: Critical Setup & Fixes

**Created:** 2025-12-22T10:00:00  
**Priority:** HIGH - Required for staff to use success.com

---

## ✅ FIXES APPLIED (Code Changes)

### 1. Pages Breaking Periodically - FIXED ✅

**Problem:** The About page and articles were randomly breaking because `prisma.$disconnect()` was being called in page components. This disconnects the shared connection pool, causing other concurrent requests to fail.

**Solution Applied:**
- Removed `prisma.$disconnect()` from `pages/about.tsx`
- Removed `prisma.$disconnect()` from `pages/[slug].tsx`
- Changed `[slug].tsx` to use singleton Prisma client from `lib/prisma`
- Fixed `pages/lp/[slug].tsx` to use singleton Prisma client

**Note:** There are 163 API routes that still create new PrismaClient instances. This is a technical debt item but won't cause the periodic breaking issue since API routes are stateless. Consider refactoring in a future session.

---

## 🔴 REQUIRED: Environment Variables Setup

For the site to work properly, ensure these environment variables are set in your deployment platform (Vercel/Amplify):

### Authentication (Required for Admin Login)

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Your production URL
NEXTAUTH_URL=https://success.com

# Database connection
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Email - Resend (Required for Password Resets, Welcome Emails)

```env
# Get from https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# MUST be a verified domain in Resend
# Format: "Display Name <email@domain.com>"
RESEND_FROM_EMAIL=SUCCESS Magazine <noreply@success.com>
```

**To Set Up Resend:**
1. Go to https://resend.com and sign up
2. Add your domain (success.com) at https://resend.com/domains
3. Verify the domain by adding the DNS records Resend provides
4. Generate an API key at https://resend.com/api-keys
5. Set both `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables

### Stripe Payments (Required for Subscriptions)

```env
# Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Get from Stripe Webhook setup (see below)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Get from Stripe Products (see below)
STRIPE_PRICE_MONTHLY=price_your_monthly_id
STRIPE_PRICE_YEARLY=price_your_yearly_id

# Your production URL
NEXT_PUBLIC_BASE_URL=https://success.com
```

---

## 🟡 STRIPE SETUP STEPS

### Step 1: Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "+ Add Product"

**Monthly Product:**
- Name: `SUCCESS+ Monthly`
- Description: Full access to SUCCESS+ premium content
- Pricing: **$7.99 USD** / month (Recurring)
- Click "Save product"
- Copy the **Price ID** → use for `STRIPE_PRICE_MONTHLY`

**Annual Product:**
- Name: `SUCCESS+ Annual`
- Description: Full access to SUCCESS+ premium content
- Pricing: **$79.99 USD** / year (Recurring)
- Click "Save product"
- Copy the **Price ID** → use for `STRIPE_PRICE_YEARLY`

### Step 2: Set Up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://success.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** → use for `STRIPE_WEBHOOK_SECRET`

### Step 3: Enable Customer Portal

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Click "Activate test link" (or live link for production)
3. Configure:
   - Allow customers to update payment methods ✅
   - Allow customers to cancel subscriptions ✅
4. Click "Save changes"

---

## 🟢 ADMIN LOGIN TROUBLESHOOTING

If admin login doesn't work, check:

### 1. Verify Environment Variables
```bash
# In your deployment logs, check if these are set:
NEXTAUTH_SECRET  # Must be at least 32 characters
NEXTAUTH_URL     # Must match your actual domain
DATABASE_URL     # Must be a valid PostgreSQL connection string
```

### 2. Check Database Has Users

```sql
-- Run this in your database to see users
SELECT id, email, name, role, "hasChangedDefaultPassword" 
FROM users 
LIMIT 10;
```

### 3. Create Initial Admin User

If no users exist, create one:

```sql
INSERT INTO users (id, name, email, password, role, "hasChangedDefaultPassword", "createdAt", "updatedAt")
VALUES (
  'admin001',
  'Admin User',
  'admin@success.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN',
  false,
  NOW(),
  NOW()
);
```

**Login Credentials:**
- Email: `admin@success.com`
- Password: `admin123` (will be forced to change on first login)

### 4. Check Secure Cookies

If using HTTPS in production:
- `NEXTAUTH_URL` should start with `https://`
- This enables secure cookie handling automatically

If testing on HTTP locally:
- `NEXTAUTH_URL` should start with `http://`

---

## 📋 QUICK CHECKLIST

### For Staff Access:
- [ ] `NEXTAUTH_SECRET` is set (32+ chars)
- [ ] `NEXTAUTH_URL` matches your domain
- [ ] `DATABASE_URL` is valid and connected
- [ ] At least one admin user exists in database
- [ ] Can login at `/admin/login`

### For Email:
- [ ] `RESEND_API_KEY` is set
- [ ] `RESEND_FROM_EMAIL` is set and verified
- [ ] Domain is verified in Resend dashboard
- [ ] Password reset emails work

### For Payments:
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `STRIPE_PRICE_MONTHLY` is set
- [ ] `STRIPE_PRICE_YEARLY` is set
- [ ] Webhook endpoint is configured in Stripe
- [ ] Customer Portal is enabled

---

## 🧪 TESTING

### Test Admin Login
1. Go to `https://success.com/admin/login`
2. Enter credentials (admin@success.com / admin123)
3. Should redirect to change password
4. After changing password, should access dashboard

### Test Stripe Checkout (Use Test Mode)
1. Go to upgrade/subscribe page
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Verify webhook was received (check Stripe Dashboard > Webhooks)

### Test Email
1. Go to `/forgot-password`
2. Enter a valid email
3. Check email for reset link
4. Complete password reset

---

## 📚 Related Documentation

- `docs/STRIPE_SETUP.md` - Full Stripe integration guide
- `docs/PRIORITY_ACTION_PLAN.md` - Original action plan
- `docs/DEPLOYMENT_ENV_VARS.md` - All environment variables
- `docs/STAFF_AUTHENTICATION_SYSTEM.md` - Staff auth details

---

## ⚠️ KNOWN ISSUES

1. **Console logs in production** - There are debug console.log statements in auth code. These are intentional for debugging login issues but should be removed once stable.

2. **163 API routes with PrismaClient** - Many API routes create their own PrismaClient instances instead of using the singleton. This is technical debt but shouldn't cause issues since API routes are stateless. Consider refactoring later.

3. **Session duration** - JWT sessions expire after 8 hours. Users will need to re-login after this time.


