# Deployment Guide - SUCCESS Next.js

## Overview
This application is deployed on **Vercel** from the `deploy` branch.

## Required Environment Variables on Vercel

### Database
- `DATABASE_URL` - PostgreSQL connection string from Prisma

### WordPress Integration
- `WORDPRESS_API_URL` - WordPress REST API endpoint (https://successcom.wpenginepowered.com/wp-json/wp/v2)

### Authentication
- `NEXTAUTH_URL` - Production URL (https://www.success.com)
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js sessions

### Email Services
- `RESEND_API_KEY` - Resend API key for transactional emails
- `SENDGRID_API_KEY` - SendGrid API key (legacy)
- `AWS_SES_ACCESS_KEY` - AWS SES access key
- `AWS_SES_SECRET_KEY` - AWS SES secret key
- `AWS_SES_REGION` - AWS region (us-east-1)

### Payment Processing
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Media Storage
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

## Pre-Deployment Checklist

### Before Pushing Code
- [ ] Run `npm run validate` to check for TypeScript errors
- [ ] Run `npm run build` locally to test build
- [ ] Ensure all new environment variables are added to Vercel dashboard
- [ ] Check that `.vercelignore` excludes unnecessary files

### After Pushing Code
- [ ] Monitor Vercel deployment status
- [ ] Check build logs for any errors
- [ ] Verify deployment at preview URL before promoting to production
- [ ] Test critical paths:
  - Homepage loads
  - Blog posts display correctly
  - Admin login works
  - Database connections succeed

## Common Build Failures & Solutions

### TypeScript Errors
**Symptom**: Build fails with TS errors
**Solution**:
1. Run `npx tsc --noEmit` locally
2. Fix all type errors
3. Ensure `tsconfig.json` excludes problematic directories

### Missing Environment Variables
**Symptom**: Runtime errors about missing env vars
**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Add missing variables for Production environment
3. Redeploy

### Prisma Generation Fails
**Symptom**: "@prisma/client did not initialize"
**Solution**:
- Verify `DATABASE_URL` is set in Vercel
- Check that `postinstall: "prisma generate"` is in package.json
- Ensure Prisma schema is committed

### Import Path Errors
**Symptom**: "Cannot find module '../api/auth/[...nextauth]'"
**Solution**:
- Use relative imports without file extensions
- Check that paths match directory structure
- Verify files are not in excluded directories

## Build Process

### How It Works
1. **Install** - npm install runs, triggers `postinstall` → prisma generate
2. **Validate** - `prebuild` hook runs TypeScript validation
3. **Build** - Next.js builds application
4. **Deploy** - Vercel deploys to edge network

### Key Files
- `.vercelignore` - Files excluded from deployment
- `tsconfig.json` - TypeScript compilation configuration
- `next.config.js` - Next.js build configuration
- `.eslintignore` - Files excluded from linting

## Git Workflow

### Branches
- `main` - Development branch
- `deploy` - Production deployment branch (auto-deploys to Vercel)

### Process
1. Make changes on `main`
2. Test locally
3. Merge `main` → `deploy`
4. Push `deploy` to trigger Vercel deployment

## Monitoring Deployments

### Check Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs <deployment-url>
```

### Cancel Deployment
```bash
vercel --prod cancel
```

## Troubleshooting

### Build Succeeds Locally But Fails on Vercel
1. Check Node.js version matches (see `engines` in package.json)
2. Verify all dependencies are in `package.json` (not just devDependencies)
3. Ensure environment variables are set on Vercel
4. Check that files aren't being excluded by `.vercelignore`

### Deployment Takes Too Long
- Normal build time: ~2 minutes
- If >5 minutes: Check for infinite loops or hung processes
- Solution: Cancel and redeploy

### 404 Errors After Deployment
- Check that routes exist in `pages/` directory
- Verify file names match URL patterns
- Ensure ISR/SSG paths are generated correctly

## Maintenance

### Regular Tasks
- Monitor Vercel usage dashboard
- Review build logs weekly for warnings
- Update dependencies monthly
- Check Prisma connection pool limits

### Emergency Rollback
1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"

## Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Last Updated**: December 2024
