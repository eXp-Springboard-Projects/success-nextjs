# AWS Amplify Environment Variables Setup

## CRITICAL: Login will NOT work without these environment variables

The login is failing because AWS Amplify needs these environment variables configured.

## Required Environment Variables

Go to AWS Amplify Console → Your App → Environment variables and add:

### 1. Database Connection
```
DATABASE_URL=postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require
```

### 2. NextAuth Configuration
```
NEXTAUTH_SECRET=fcnyMXkhQ4CXPl3HfWu8cwGvIf25x/PwANzAdiFbZy4=

NEXTAUTH_URL=https://main-qa.d1wyvvb2uue8p8.amplifyapp.com
```

### 3. Node Environment
```
NODE_ENV=production
```

## After Setting Environment Variables

1. **Save** the environment variables in AWS Amplify
2. **Redeploy** the application (or wait for auto-deploy)
3. **Wait** 2-3 minutes for build to complete
4. **Test** login at: https://main-qa.d1wyvvb2uue8p8.amplifyapp.com/admin/login

## Test Credentials

- **Email**: admin@success.com
- **Password**: Success2025!

## Verify Environment Variables Are Set

After deployment, visit: https://main-qa.d1wyvvb2uue8p8.amplifyapp.com/api/health

This endpoint will show if environment variables are configured correctly.

## Common Issues

### Login fails with "Invalid credentials"
- ✅ Database credentials work (verified with local test)
- ❌ NEXTAUTH_SECRET or DATABASE_URL not set in Amplify

### Build fails
- Check Amplify build logs
- Verify DATABASE_URL is set (Prisma needs it at build time)

### 500 Error on login
- NEXTAUTH_SECRET is missing or wrong
- Check Amplify logs for error details
