# AWS Amplify Environment Variables Setup

Copy these environment variables into AWS Amplify Console:
**App settings → Environment variables**

## Required Variables (Set these immediately)

```bash
# Database (Prisma + Postgres)
DATABASE_URL=postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require

POSTGRES_URL=postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require

PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19MWUhkZ2s4Um9tWm9uVXBnSTlTOTciLCJhcGlfa2V5IjoiMDFLNzRKQ1hKOVBWQzlNSFo3MEJUUDZDMzciLCJ0ZW5hbnRfaWQiOiJlNzMxZjhjMzUxZjE5NzRjNzg4YjczOTIwM2IwMDExMzU2MWNhNmUyNmEwYThjMGQ3ZDVlZmNlYThjZjliNjU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTJhMGI1MjEtZDgxNS00NzBjLThkY2ItMWJmOGJhYzE2M2Y1In0.2DLBbviT4Dpq_igcWept_mRDpe_kyZ3k1DuIkBZY6ro

# NextAuth (Authentication)
NEXTAUTH_SECRET=gIi7IGU5xBhP8QHjeG58EIKAN0bpFWZaHPyI0hSQa4I=

# WordPress API
WORDPRESS_API_URL=https://success.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_API_URL=https://success.com/wp-json/wp/v2

# Security
CRON_SECRET=a3f8b2e7c9d4f1a6b5e8c2d7f3a9b1c4e6d8f2a5b7c9d1e3f5a7b9c1d3e5f7a9

# Feature Flags
ENABLE_SUBSCRIPTIONS=true
ENABLE_VIDEOS=true
ENABLE_PODCASTS=true
ENABLE_NEWSLETTER=true
ENABLE_COMMENTS=true
```

## Variables to Update AFTER First Deployment

Once your Amplify app is deployed, you'll get a URL like:
`https://main.d1a2b3c4d5e6f7.amplifyapp.com`

Then update these variables:

```bash
NEXTAUTH_URL=https://main.YOUR_AMPLIFY_ID.amplifyapp.com
NEXT_PUBLIC_SITE_URL=https://main.YOUR_AMPLIFY_ID.amplifyapp.com
NEXT_PUBLIC_API_URL=https://main.YOUR_AMPLIFY_ID.amplifyapp.com
```

After updating, redeploy the app.

## Optional Variables (Add if you need these features)

```bash
# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=SUCCESS Magazine <noreply@success.com>

# Analytics (Google Analytics 4)
NEXT_PUBLIC_GA_ID=

# Stripe Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# PayKickstart
PAYKICKSTART_WEBHOOK_SECRET=
PAYKICKSTART_API_KEY=
PAYKICKSTART_VENDOR_ID=

# Magazine Fulfillment
CW_WEBHOOK_URL=
CW_WEBHOOK_SECRET=
```

## Build Settings in Amplify

These should be auto-detected from `amplify.yml`, but verify:

- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Node version**: 22 (from `.nvmrc`)

## Deployment Flow

1. Set all required environment variables (above)
2. Save and trigger a new build
3. Wait for build to complete (~5-10 minutes)
4. Copy your Amplify URL
5. Update `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`
6. Redeploy
7. Test the deployment!

## Testing Checklist

- [ ] Homepage loads
- [ ] Blog posts load
- [ ] Admin login works (https://YOUR_AMPLIFY_URL/admin/login)
- [ ] WordPress content syncs
- [ ] Images display correctly
- [ ] Search works

## Differences from Vercel

AWS Amplify and Vercel will use the **same database** (same `DATABASE_URL`), so:
- ✅ Same content on both
- ✅ Same users and subscriptions
- ⚠️ Be careful with admin actions (they affect both deployments)

## Which URL Should You Use?

- **Production users**: Keep using Vercel (https://success-nextjs.vercel.app/)
- **Testing/Staging**: Use AWS Amplify URL
- **Staff testing**: Can use AWS Amplify URL

## Custom Domain (Optional)

Later, you can add custom domains in Amplify:
- staging.successmagazine.com → AWS Amplify
- www.successmagazine.com → Vercel

---

**Questions?** Check the AWS Amplify build logs for any deployment errors.
