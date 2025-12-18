# Vercel Deployment Guide for SUCCESS.com

Quick guide to deploy SUCCESS.com to Vercel

---

## 📋 Prerequisites

- [ ] Vercel account created (https://vercel.com/signup)
- [ ] GitHub repository pushed
- [ ] PostgreSQL database ready (Vercel Postgres, Supabase, Railway, etc.)

---

## 🚀 Method 1: Vercel Dashboard (Easiest)

### Step 1: Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"

### Step 2: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave default)

**Build Command:** `prisma generate && next build` (already set in vercel.json)

**Install Command:** `npm install` (default)

### Step 3: Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `DATABASE_URL` | `postgresql://...` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Generate new | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Your Vercel deployment URL |
| `WORDPRESS_API_URL` | `https://www.success.com/wp-json/wp/v2` | WordPress REST API |
| `NEXT_PUBLIC_WORDPRESS_API_URL` | `https://www.success.com/wp-json/wp/v2` | Same as above (client-side) |

#### Optional Variables (Add Later)

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | For payment processing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Client-side Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | After creating webhook |
| `SMTP_HOST` | `smtp.sendgrid.net` | For email notifications |
| `SMTP_USER` | Your SMTP username | |
| `SMTP_PASSWORD` | Your SMTP password | |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Google Analytics |

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Visit your deployment URL

### Step 5: Set Up Database

Once deployed, run migrations:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link to your project
vercel link

# Run migrations on production database
vercel env pull .env.production
npx prisma migrate deploy
```

---

## 🛠️ Method 2: Vercel CLI (Advanced)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Link Project

```bash
# In your project directory
vercel link
```

### Step 4: Add Environment Variables

```bash
# Add one at a time
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add WORDPRESS_API_URL production
vercel env add NEXT_PUBLIC_WORDPRESS_API_URL production
```

Or use the dashboard for easier management.

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod
```

---

## 🗄️ Database Setup Options

### Option 1: Vercel Postgres (Recommended)

1. Go to your project in Vercel Dashboard
2. Click "Storage" tab
3. Create "Postgres Database"
4. Copy connection string
5. Add as `DATABASE_URL` environment variable
6. Run migrations: `vercel env pull && npx prisma migrate deploy`

### Option 2: Supabase

1. Create project at https://supabase.com
2. Go to Settings > Database
3. Copy connection string (Transaction pooler, port 5432)
4. Replace password placeholder
5. Add as `DATABASE_URL`

### Option 3: Railway

1. Create project at https://railway.app
2. Add PostgreSQL service
3. Copy connection string
4. Add as `DATABASE_URL`

### Option 4: Your Own PostgreSQL

Use your existing PostgreSQL server connection string.

---

## 🔐 Generate Secrets

### NEXTAUTH_SECRET

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Online (if needed):**
Visit: https://generate-secret.vercel.app/32

---

## ✅ Post-Deployment Checklist

### Immediate (After First Deploy)

- [ ] Visit deployment URL - verify homepage loads
- [ ] Check `/admin/login` - verify login page loads
- [ ] Test admin login (create user first - see below)
- [ ] Check `/api/rss` - verify RSS feed works
- [ ] Check `/api/sitemap.xml` - verify sitemap works
- [ ] Submit test contact form

### Create Admin User

**Option 1: Using Prisma Studio**
```bash
# Pull production env vars
vercel env pull .env.production

# Open Prisma Studio
npx prisma studio

# In browser: Create new User with:
# - email: your-email@success.com
# - password: (hash using bcrypt - see below)
# - role: SUPER_ADMIN
```

**Option 2: Using SQL**
```bash
# Connect to your database and run:
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
*Default password: "admin123" (change immediately!)*

**Option 3: Create hash for your password**
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

### Within 24 Hours

- [ ] Change default admin password
- [ ] Add team member accounts
- [ ] Test all admin features
- [ ] Verify WordPress API connection
- [ ] Check error logs in Vercel dashboard

### Before Public Launch

- [ ] Custom domain configured
- [ ] SSL certificate verified (automatic with Vercel)
- [ ] Analytics tracking added
- [ ] Stripe configured (if using payments)
- [ ] SMTP configured (if using email)
- [ ] Legal pages reviewed
- [ ] Mobile responsive tested
- [ ] Performance audit (Lighthouse)

---

## 🔧 Custom Domain Setup

### Step 1: Add Domain

1. Go to Project Settings > Domains
2. Add your domain: `www.success.com`
3. Add apex domain: `success.com`

### Step 2: Configure DNS

**For www.success.com:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**For success.com (apex):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

- Type: `A`
- Name: `@`
- Value: `76.76.21.22`

- Type: `A`
- Name: `@`
- Value: `76.76.21.23`

- Type: `A`
- Name: `@`
- Value: `76.76.21.24`

### Step 3: Update Environment Variables

Update `NEXTAUTH_URL` to your custom domain:
```
NEXTAUTH_URL=https://www.success.com
```

---

## 📊 Monitoring & Logs

### View Logs

**Vercel Dashboard:**
1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. View "Functions" logs

**Vercel CLI:**
```bash
vercel logs [deployment-url]
```

### Monitor Performance

**Vercel Analytics:**
1. Go to Project Settings > Analytics
2. Enable Web Analytics
3. View real-time data

---

## 🐛 Troubleshooting

### Build Fails with Prisma Error

**Error:** "Prisma Client could not be generated"

**Solution:**
```bash
# In vercel.json, buildCommand includes prisma generate
# If still failing, check DATABASE_URL is set in build environment
```

### Database Connection Error

**Error:** "Can't reach database server"

**Solution:**
- Verify `DATABASE_URL` format
- Check database is accepting connections
- Verify SSL mode if required: `?sslmode=require`

### NextAuth Session Error

**Error:** "No secret provided"

**Solution:**
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches deployment URL
- Redeploy after adding variables

### WordPress API Not Loading

**Error:** "Failed to fetch WordPress data"

**Solution:**
- Test API directly: `curl https://www.success.com/wp-json/wp/v2/posts?per_page=1`
- Verify `NEXT_PUBLIC_WORDPRESS_API_URL` is set (for client-side)
- Check CORS if needed

### 404 on Admin Pages

**Solution:**
- Check middleware.js is deployed
- Verify no build errors
- Check function logs for errors

---

## 🔄 Redeployment

### Trigger Redeploy

**Vercel Dashboard:**
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

**Vercel CLI:**
```bash
vercel --prod
```

**Git Push:**
```bash
git push origin main
# Automatic deployment triggers
```

### Update Environment Variables

After changing env vars, trigger redeploy for changes to take effect.

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org

---

## 🎯 Quick Commands Reference

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull

# Deploy to production
vercel --prod

# View logs
vercel logs

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

**Estimated Deployment Time:** 15-30 minutes

**First Deploy:** Ready to test immediately after deployment
**Production Ready:** After database setup and admin user creation (~45 minutes total)
