# 🚀 PRIORITY ACTION PLAN

**Created:** 2025-12-17  
**Goal:** Get staff working + Stripe payments live

---

## 🔴 IMMEDIATE ACTIONS (Do Now)

### ✅ 1. Security Fix Applied
The admin authentication middleware was disabled! I've **already fixed this** - authentication is now enforced on all `/admin` routes.

### 2. Verify Database is Connected
Check if your PostgreSQL database is set up and connected:

```bash
# From project root, run:
npx prisma db push
```

If this fails, you need a database. Options:
- **Vercel Postgres** (recommended): https://vercel.com/storage/postgres
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

---

## 🟡 PRIORITY 1: Get Staff Working (30 min)

### Step 1: Create First Admin Account

Open Prisma Studio:
```bash
npx prisma studio
```

Or run this SQL directly:
```sql
INSERT INTO users (id, name, email, password, role, "hasChangedDefaultPassword", "createdAt", "updatedAt")
VALUES (
  'admin001',
  'First Admin',
  'admin@success.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'SUPER_ADMIN',
  false,
  NOW(),
  NOW()
);
```

**Login credentials:** 
- Email: `admin@success.com`
- Password: `admin123` (will be forced to change)

### Step 2: Staff Self-Registration

Staff with @success.com emails can register themselves:
1. Go to: `https://your-site.com/register`
2. Enter their @success.com email
3. They'll get temporary password: `SUCCESS123!`
4. They MUST change password on first login

### Step 3: Test Article Creation

1. Login at `/admin/login`
2. Change password when prompted
3. Go to `/admin/posts/new`
4. Create a test article
5. Publish it

**Article Features Available:**
- ✅ Rich text editor (TipTap)
- ✅ Image uploads
- ✅ Categories & Tags
- ✅ SEO title/description
- ✅ Featured images
- ✅ Draft/Publish status
- ✅ Auto-save every 3 seconds
- ✅ Revision history

---

## 🟡 PRIORITY 2: Set Up Stripe Payments (45 min)

### Step 1: Get Your Stripe API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key** → `pk_test_...`
   - **Secret key** → `sk_test_...`

### Step 2: Create Products in Stripe

1. Go to: https://dashboard.stripe.com/test/products
2. Create **Monthly** product:
   - Name: `SUCCESS+ Monthly`
   - Price: `$7.99/month` (recurring)
   - Copy the Price ID → `price_...`
   
3. Create **Annual** product:
   - Name: `SUCCESS+ Annual`
   - Price: `$79.99/year` (recurring)
   - Copy the Price ID → `price_...`

### Step 3: Set Up Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-site.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret → `whsec_...`

### Step 4: Add Environment Variables

In Vercel (or your hosting):

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_YEARLY=price_your_yearly_price_id

# Your site URL
NEXT_PUBLIC_BASE_URL=https://your-site.com
```

### Step 5: Test Checkout

1. Go to your signup/upgrade page
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits

---

## 🟢 PRIORITY 3: Optional Improvements

### Email Setup (for password resets, notifications)
Add to environment variables:
```env
RESEND_API_KEY=re_your_api_key_here
```
Get key from: https://resend.com

### Google Analytics
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Customer Portal
Enable at: https://dashboard.stripe.com/test/settings/billing/portal

---

## ✅ FEATURE STATUS SUMMARY

| Feature | Status | Notes |
|---------|--------|-------|
| Staff Registration | ✅ Ready | `/register` for @success.com emails |
| Staff Login | ✅ Ready | `/admin/login` |
| Admin Dashboard | ✅ Ready | 60+ pages |
| Article Editor | ✅ Ready | Full TipTap editor with all blocks |
| Create/Edit Posts | ✅ Ready | Auto-save, revisions, SEO |
| Categories & Tags | ✅ Ready | Full management |
| WordPress Sync | ✅ Ready | Auto-syncs content |
| Stripe Payments | 🟡 Needs Config | Add API keys (see above) |
| Email System | 🟡 Needs Config | Add Resend API key |
| Middleware Auth | ✅ Fixed | Was disabled, now enabled |

---

## 🔧 ENVIRONMENT VARIABLES CHECKLIST

**Required for basic operation:**
- [x] `DATABASE_URL` - PostgreSQL connection string
- [x] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [x] `NEXTAUTH_URL` - Your site URL
- [x] `WORDPRESS_API_URL` - https://www.success.com/wp-json/wp/v2

**Required for Stripe:**
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - From webhook setup
- [ ] `STRIPE_PRICE_MONTHLY` - Monthly price ID
- [ ] `STRIPE_PRICE_YEARLY` - Annual price ID
- [ ] `NEXT_PUBLIC_BASE_URL` - Your site URL

**Optional but recommended:**
- [ ] `RESEND_API_KEY` - For email functionality
- [ ] `NEXT_PUBLIC_GA_ID` - For analytics

---

## 🚨 KNOWN ISSUES TO BE AWARE OF

1. **Console.log statements** - There are 91+ console.log statements that should be cleaned up for production (minor, not blocking)

2. **First login** - All new staff users MUST change their password from `SUCCESS123!` before they can access the dashboard

3. **WordPress write access** - Content can be viewed from WordPress, but to EDIT content you'll need WordPress Application Password set up

---

## 📞 QUICK COMMANDS

```bash
# Start development server
npm run dev

# Open database browser
npx prisma studio

# Run migrations
npx prisma migrate deploy

# Build for production
npm run build
```

---

**Questions?** Check the following docs:
- `STRIPE_SETUP.md` - Full Stripe guide
- `STAFF_AUTHENTICATION_SYSTEM.md` - Staff login details
- `ADMIN_DASHBOARD_FEATURES.md` - Admin features

