# Environment Variables Reference

Complete guide to all environment variables used in the SUCCESS.com admin platform.

## Required Variables

### Database & Supabase

**`DATABASE_URL`**
- **Description:** PostgreSQL connection string for Supabase
- **Format:** `postgres://[user]:[password]@[host]:5432/[database]?sslmode=require`
- **Example:** `postgres://user:pass@db.prisma.io:5432/db?sslmode=require`
- **Required:** Yes
- **Used in:** API endpoints, database queries

**`NEXT_PUBLIC_SUPABASE_URL`**
- **Description:** Public Supabase project URL
- **Format:** `https://[project-id].supabase.co`
- **Example:** `https://aczlassjkbtwenzsohwm.supabase.co`
- **Required:** Yes
- **Used in:** Client-side Supabase queries

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- **Description:** Supabase anonymous (public) key
- **Format:** Long JWT token starting with `eyJ...`
- **Required:** Yes
- **Security:** Safe to expose to client
- **Used in:** Client-side Supabase authentication

**`SUPABASE_SERVICE_ROLE_KEY`**
- **Description:** Supabase service role key (bypasses RLS)
- **Format:** Long JWT token starting with `eyJ...`
- **Required:** Yes
- **Security:** ⚠️ NEVER expose to client - server-side only
- **Used in:** Admin API endpoints

### Authentication

**`NEXTAUTH_URL`**
- **Description:** Base URL of the application
- **Development:** `http://localhost:3000`
- **Production:** `https://www.success.com` or `https://admin.success.com`
- **Required:** Yes
- **Used in:** NextAuth redirects, callbacks

**`NEXTAUTH_SECRET`**
- **Description:** Secret key for signing JWT tokens
- **Format:** Random string (min 32 characters)
- **Generate:** `openssl rand -base64 32`
- **Required:** Yes
- **Security:** ⚠️ Keep secret, rotate regularly
- **Used in:** Session encryption

### WordPress API

**`WORDPRESS_API_URL`**
- **Description:** WordPress REST API endpoint
- **Default:** `https://successcom.wpenginepowered.com/wp-json/wp/v2`
- **Required:** Yes
- **Used in:** Fetching posts, categories, pages

---

## Optional Variables

### Email Configuration

**`SMTP_HOST`**
- **Description:** SMTP server hostname
- **Examples:**
  - SendGrid: `smtp.sendgrid.net`
  - Gmail: `smtp.gmail.com`
  - AWS SES: `email-smtp.us-east-1.amazonaws.com`
- **Required:** No (email features won't work without it)

**`SMTP_PORT`**
- **Description:** SMTP server port
- **Common values:** `587` (TLS), `465` (SSL), `25` (unsecured)
- **Recommended:** `587`
- **Required:** No

**`SMTP_USER`**
- **Description:** SMTP authentication username
- **SendGrid:** Use `apikey` as username
- **Gmail:** Your email address
- **Required:** No

**`SMTP_PASSWORD`**
- **Description:** SMTP authentication password
- **SendGrid:** Your API key
- **Gmail:** App-specific password
- **Security:** ⚠️ Never commit to repository
- **Required:** No

**`SMTP_FROM`**
- **Description:** Default "From" email address
- **Example:** `noreply@success.com`
- **Required:** No
- **Best Practice:** Use verified domain

### Stripe (Payment Processing)

**`STRIPE_SECRET_KEY`**
- **Description:** Stripe secret API key
- **Development:** `sk_test_...`
- **Production:** `sk_live_...`
- **Security:** ⚠️ Server-side only
- **Required:** Only if using shop features

**`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**
- **Description:** Stripe publishable key
- **Development:** `pk_test_...`
- **Production:** `pk_live_...`
- **Security:** Safe to expose
- **Required:** Only if using shop features

**`STRIPE_WEBHOOK_SECRET`**
- **Description:** Stripe webhook signing secret
- **Format:** `whsec_...`
- **Used in:** Verifying webhook authenticity
- **Required:** Only if processing webhooks

### File Storage

**`CLOUDINARY_CLOUD_NAME`**
- **Description:** Cloudinary cloud name
- **Example:** `success-magazine`
- **Required:** Only if using Cloudinary for uploads

**`CLOUDINARY_API_KEY`**
- **Description:** Cloudinary API key
- **Format:** Numeric string
- **Required:** Only if using Cloudinary

**`CLOUDINARY_API_SECRET`**
- **Description:** Cloudinary API secret
- **Security:** ⚠️ Keep secret
- **Required:** Only if using Cloudinary

**Alternative: AWS S3**

**`AWS_ACCESS_KEY_ID`**
- **Description:** AWS IAM access key
- **Required:** Only if using S3

**`AWS_SECRET_ACCESS_KEY`**
- **Description:** AWS IAM secret key
- **Security:** ⚠️ Keep secret
- **Required:** Only if using S3

**`AWS_REGION`**
- **Description:** AWS region for S3 bucket
- **Example:** `us-east-1`
- **Required:** Only if using S3

**`AWS_S3_BUCKET`**
- **Description:** S3 bucket name
- **Example:** `success-media`
- **Required:** Only if using S3

### Analytics & Monitoring

**`NEXT_PUBLIC_GA_ID`**
- **Description:** Google Analytics measurement ID
- **Format:** `G-XXXXXXXXXX` (GA4) or `UA-XXXXXXXXX-X` (Universal)
- **Example:** `G-ABC123DEF4`
- **Required:** No
- **Used in:** Client-side analytics tracking

**`SENTRY_DSN`**
- **Description:** Sentry error tracking DSN
- **Format:** `https://[key]@o[org].ingest.sentry.io/[project]`
- **Required:** No
- **Recommended:** Yes for production

**`SENTRY_AUTH_TOKEN`**
- **Description:** Sentry authentication token for source maps
- **Required:** No (but needed for source map upload)

**`VERCEL_ANALYTICS_ID`**
- **Description:** Vercel Analytics ID (auto-set by Vercel)
- **Required:** No
- **Note:** Automatically configured in Vercel deployments

### Feature Flags

**`NEXT_PUBLIC_ENABLE_COMMUNITY`**
- **Description:** Enable/disable community forum features
- **Values:** `true` | `false`
- **Default:** `true`
- **Use case:** Temporarily disable features

**`NEXT_PUBLIC_ENABLE_SHOP`**
- **Description:** Enable/disable shop/products features
- **Values:** `true` | `false`
- **Default:** `true`

**`NEXT_PUBLIC_MAINTENANCE_MODE`**
- **Description:** Enable maintenance mode
- **Values:** `true` | `false`
- **Default:** `false`
- **Effect:** Shows maintenance page to all users

### Development & Debugging

**`NODE_ENV`**
- **Description:** Node environment
- **Values:** `development` | `production` | `test`
- **Auto-set by:** Next.js
- **Required:** Yes (auto-set)

**`NEXT_PUBLIC_DEBUG_MODE`**
- **Description:** Enable debug logging
- **Values:** `true` | `false`
- **Default:** `false`
- **Security:** ⚠️ NEVER enable in production

**`LOG_LEVEL`**
- **Description:** Logging verbosity
- **Values:** `error` | `warn` | `info` | `debug`
- **Default:** `info`
- **Production:** `error` or `warn`

---

## Environment Files

### Development: `.env.local`
```bash
# Database
DATABASE_URL="postgres://..."
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# WordPress
WORDPRESS_API_URL="https://successcom.wpenginepowered.com/wp-json/wp/v2"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Optional: Email (for testing)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-username"
SMTP_PASSWORD="your-password"
SMTP_FROM="dev@success.com"

# Debug
NEXT_PUBLIC_DEBUG_MODE="true"
LOG_LEVEL="debug"
```

### Production: `.env.production`
```bash
# Database
DATABASE_URL="postgres://prod-user:prod-pass@prod-host:5432/prod-db"
NEXT_PUBLIC_SUPABASE_URL="https://[prod-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Auth
NEXTAUTH_URL="https://www.success.com"
NEXTAUTH_SECRET="[generate-strong-secret]"

# WordPress
WORDPRESS_API_URL="https://www.success.com/wp-json/wp/v2"

# Stripe (Live Mode)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="[sendgrid-api-key]"
SMTP_FROM="noreply@success.com"

# File Storage
CLOUDINARY_CLOUD_NAME="success-magazine"
CLOUDINARY_API_KEY="[your-key]"
CLOUDINARY_API_SECRET="[your-secret]"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
SENTRY_DSN="https://[key]@sentry.io/[project]"

# Production Settings
NODE_ENV="production"
LOG_LEVEL="error"
NEXT_PUBLIC_DEBUG_MODE="false"
```

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.development
.env*.local
```

### 2. Use Different Secrets Per Environment
- Development: Can use weak/test secrets
- Staging: Use production-like secrets
- Production: Strong, unique secrets

### 3. Rotate Secrets Regularly
- Database passwords: Every 90 days
- API keys: Every 6 months
- NEXTAUTH_SECRET: Every year

### 4. Use Environment-Specific Keys
- Stripe: `sk_test_` for dev, `sk_live_` for prod
- Separate Supabase projects for dev/prod

### 5. Limit Secret Access
- Use secret management tools (AWS Secrets Manager, Vercel Env Variables)
- Don't share secrets via email/chat
- Use team password managers

---

## Vercel Configuration

When deploying to Vercel, add environment variables via:

1. **Dashboard:** Project Settings → Environment Variables
2. **CLI:** `vercel env add [NAME]`
3. **vercel.json:**
   ```json
   {
     "env": {
       "NEXTAUTH_URL": "https://www.success.com"
     }
   }
   ```

**Environments in Vercel:**
- **Production:** Used for production deployments
- **Preview:** Used for pull request previews
- **Development:** Used for local development

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is accessible
- Check SSL mode requirement

### "NextAuth session error"
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches current URL
- Clear browser cookies and retry

### "Supabase anon key invalid"
- Verify key copied correctly (no extra spaces)
- Check key matches project in `NEXT_PUBLIC_SUPABASE_URL`
- Regenerate key in Supabase dashboard if needed

### "Stripe error: Invalid API key"
- Ensure using correct mode (test vs live)
- Check key hasn't been revoked in Stripe dashboard
- Verify no extra characters in env variable

---

## Validation Script

```bash
# scripts/validate-env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  WORDPRESS_API_URL: z.string().url(),
  // Add all required variables
});

try {
  envSchema.parse(process.env);
  console.log('✅ All required environment variables are set');
} catch (error) {
  console.error('❌ Missing or invalid environment variables:', error);
  process.exit(1);
}
```

Run before deployment:
```bash
npx tsx scripts/validate-env.ts
```

---

Generated by Claude Code on January 4, 2026
