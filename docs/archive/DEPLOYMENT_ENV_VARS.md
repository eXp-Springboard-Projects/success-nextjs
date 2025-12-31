# Deployment Environment Variables - Required for Vercel & AWS Amplify

## ✅ Build Status
- **Local Build**: ✅ PASSING
- **GitHub Actions CI**: ✅ PASSING (5/5 checks)
- **Vercel**: ❌ FAILING (missing environment variables)
- **AWS Amplify**: ❌ FAILING (missing environment variables)

## 🚨 Critical Issue
Both Vercel and AWS Amplify deployments are failing because **required environment variables are not configured** in their respective dashboards.

---

## Required Environment Variables

### 1. DATABASE (REQUIRED - Build will fail without this)
```
DATABASE_URL=postgres://username:password@host:5432/database?sslmode=require
```
**Where to get it:**
- Vercel Postgres: https://vercel.com/dashboard → Storage → Postgres
- Or use the Prisma/Neon database URL from .env.local

**For Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select your project: `success-nextjs`
3. Go to: Settings → Environment Variables
4. Add: `DATABASE_URL` = `[your database connection string]`
5. Set for: Production, Preview, Development

**For AWS Amplify:**
1. Go to: AWS Amplify Console
2. Select your app
3. Go to: App Settings → Environment Variables
4. Add: `DATABASE_URL` = `[your database connection string]`

---

### 2. AUTHENTICATION (REQUIRED)
```
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
NEXTAUTH_URL=https://your-production-domain.com
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**For Vercel:**
- `NEXTAUTH_URL` = `https://success-nextjs.vercel.app` (or your custom domain)

**For AWS Amplify:**
- `NEXTAUTH_URL` = `https://main.your-amplify-domain.amplifyapp.com` (or your custom domain)

---

### 3. WORDPRESS API (REQUIRED for content)
```
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
```

---

### 4. STRIPE (REQUIRED if using payments)
```
STRIPE_SECRET_KEY=sk_live_xxxxx (or sk_test_xxxxx for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx (or pk_test_xxxxx)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**If you don't have Stripe yet**, use test values:
```
STRIPE_SECRET_KEY=sk_test_placeholder_minimum_32_characters_needed_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

---

### 5. EMAIL (REQUIRED for notifications)
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=SUCCESS Magazine <noreply@success.com>
```

**If you don't have Resend yet**, use placeholder:
```
RESEND_API_KEY=placeholder_resend_key_not_configured_yet
RESEND_FROM_EMAIL=noreply@success.com
```

---

### 6. OPTIONAL (Can be added later)
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ADMIN_EMAIL=admin@success.com
```

---

## 📋 Quick Setup Checklist

### For Vercel:
1. ✅ Go to https://vercel.com/dashboard
2. ✅ Select project: `success-nextjs`
3. ✅ Navigate to: Settings → Environment Variables
4. ✅ Add these REQUIRED variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `WORDPRESS_API_URL`
   - `NEXT_PUBLIC_WORDPRESS_API_URL`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`
5. ✅ Set environment for: Production, Preview, Development
6. ✅ Redeploy: Deployments → Click latest deployment → Redeploy

### For AWS Amplify:
1. ✅ Go to: AWS Amplify Console
2. ✅ Select your app
3. ✅ Navigate to: App Settings → Environment Variables
4. ✅ Add the same variables as above
5. ✅ Redeploy: Click "Redeploy this version"

---

## 🔍 How to Verify Deployment

### After adding environment variables:

**For Vercel:**
1. Go to Deployments tab
2. Trigger a new deployment or redeploy the latest
3. Check build logs for errors
4. Look for: "✓ Compiled successfully"

**For AWS Amplify:**
1. Go to the app in Amplify Console
2. Check the latest build in "Build history"
3. Look for all phases to pass:
   - Provision
   - Build
   - Deploy
   - Verify

---

## 🐛 Common Errors and Solutions

### Error: "Prisma Client validation failed"
**Cause:** Missing or invalid `DATABASE_URL`
**Solution:** Ensure DATABASE_URL is a valid PostgreSQL connection string

### Error: "NEXTAUTH_SECRET must be set"
**Cause:** Missing NEXTAUTH_SECRET
**Solution:** Generate with `openssl rand -base64 32` and add to environment variables

### Error: "Stripe is not configured"
**Cause:** Missing STRIPE keys
**Solution:** Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (even if test values)

### Error: "Failed to send email"
**Cause:** Missing RESEND_API_KEY
**Solution:** Sign up for Resend.com (free tier) or use placeholder value

---

## 📝 Notes

1. **ALL environment variables must be set in BOTH Vercel and AWS Amplify**
2. GitHub Actions CI is already configured and passing
3. Local development uses `.env.local` file
4. Production deployments use environment variables from the dashboard
5. After adding variables, you MUST redeploy for changes to take effect

---

## ✅ Expected Result

After configuring all environment variables correctly:

- ✅ Local build: PASSES
- ✅ GitHub Actions CI: PASSES (5/5 checks)
- ✅ Vercel deployment: PASSES
- ✅ AWS Amplify deployment: PASSES

The Pages admin decoupling changes will then appear on the live site.
