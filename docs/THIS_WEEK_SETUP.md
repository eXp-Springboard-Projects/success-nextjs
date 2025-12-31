# This Week Setup Guide

> **Created:** 2025-12-22
> 
> Quick setup guide to get SUCCESS.com working for staff this week:
> 1. Admin login working ✅
> 2. Email sending configured
> 3. Stripe payments connected

---

## 🔐 1. Admin Login (FIXED)

**Issue:** Admin login wasn't working because middleware was missing.

**Fix Applied:** Created `middleware.ts` to protect admin routes.

### How to Test Admin Login:

1. Go to: `https://your-site.com/admin/login`
2. Enter credentials (staff must have @success.com email)
3. Should redirect to `/admin` dashboard after login

### If Login Still Doesn't Work:

**Check environment variables in Vercel:**
```env
NEXTAUTH_SECRET=your-32-character-secret-here
NEXTAUTH_URL=https://your-site.com
DATABASE_URL=postgresql://...
```

**Generate NEXTAUTH_SECRET if missing:**
```bash
openssl rand -base64 32
```

---

## 📧 2. Resend Email Configuration

### Step 1: Get API Key from Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up or log in
3. Go to **API Keys** in the sidebar
4. Click **Create API Key**
5. Name it "SUCCESS Production"
6. Copy the key (starts with `re_...`)

### Step 2: Verify Your Domain (IMPORTANT!)

Resend requires domain verification to send emails:

1. Go to **Domains** in Resend sidebar
2. Click **Add Domain**
3. Enter: `success.com` (or your sending domain)
4. Add the DNS records Resend provides:
   - MX record
   - TXT record (SPF)
   - TXT record (DKIM)
5. Wait for verification (usually 5-30 minutes)

### Step 3: Add to Vercel Environment Variables

Go to Vercel → Project → Settings → Environment Variables

Add these:
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=SUCCESS Magazine <noreply@success.com>
```

**⚠️ The from email MUST use a verified domain!**

### Step 4: Redeploy

After adding environment variables:
1. Go to Vercel → Deployments
2. Click the "..." menu on latest deployment
3. Click "Redeploy"

### Test Email

After setup, test by:
1. Login to admin dashboard
2. Go to Staff Management
3. Try sending a test email to yourself

---

## 💳 3. Stripe Payment Configuration

### Step 1: Get Stripe API Keys

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in the right mode:
   - **Test mode** for testing (toggle in sidebar)
   - **Live mode** for production
3. Go to **Developers** → **API Keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Create Products & Prices

In Stripe Dashboard → **Products**:

#### Product 1: SUCCESS+ Monthly
1. Click **Add Product**
2. Name: `SUCCESS+ Monthly`
3. Description: `Full access to SUCCESS+ premium content`
4. Click **Add pricing**:
   - Price: `$7.99`
   - Billing period: `Monthly`
   - Click **Save**
5. Copy the **Price ID** (starts with `price_`)

#### Product 2: SUCCESS+ Annual
1. Click **Add Product**
2. Name: `SUCCESS+ Annual`
3. Description: `Full access to SUCCESS+ premium content - Save with annual billing`
4. Click **Add pricing**:
   - Price: `$79.99`
   - Billing period: `Yearly`
   - Click **Save**
5. Copy the **Price ID** (starts with `price_`)

### Step 3: Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-site.com/api/stripe/webhooks`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Add to Vercel Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Step 2)
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_YEARLY=price_your_yearly_price_id
```

### Step 5: Create Payment Links (Quick Option)

If you just need simple payment links:

1. Go to Stripe Dashboard → **Payment Links**
2. Click **New link**
3. Select your product (SUCCESS+ Monthly or Annual)
4. Configure:
   - Redirect after payment: `https://your-site.com/success`
   - Collect email: Yes
5. Copy the payment link
6. Use directly on your website or marketing materials

---

## ✅ Quick Checklist

### Environment Variables Needed:

```env
# Auth (Required)
NEXTAUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://your-site.com

# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/db

# WordPress (Required for content)
WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_API_URL=https://successcom.wpenginepowered.com/wp-json/wp/v2

# Email (For staff emails, password resets)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=SUCCESS Magazine <noreply@success.com>

# Payments (For subscriptions)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_YEARLY=price_xxxxxxxxxxxxx
```

### After Adding Variables:

1. ✅ Redeploy the site in Vercel
2. ✅ Test admin login
3. ✅ Test sending a test email
4. ✅ Test checkout flow with Stripe test card: `4242 4242 4242 4242`

---

## 🆘 Troubleshooting

### "Invalid credentials" on login
- Check DATABASE_URL is correct
- Verify user exists in database with correct email/password
- Check NEXTAUTH_SECRET is set

### "Email service not configured"
- Add RESEND_API_KEY to Vercel
- Verify domain in Resend dashboard
- Redeploy after adding env vars

### "Stripe is not configured"  
- Add STRIPE_SECRET_KEY to Vercel
- Make sure key starts with `sk_test_` or `sk_live_`
- Redeploy after adding env vars

### Webhook not working
- Verify webhook URL is correct in Stripe dashboard
- Check STRIPE_WEBHOOK_SECRET matches
- Ensure webhook events are selected

---

## 📞 Support Contacts

- **Vercel Issues:** Check Vercel deployment logs
- **Stripe Issues:** Stripe dashboard → Developers → Logs
- **Email Issues:** Resend dashboard → Logs


