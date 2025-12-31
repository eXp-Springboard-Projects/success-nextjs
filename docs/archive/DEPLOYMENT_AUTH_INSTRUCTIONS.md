# 🚀 Staff Authentication System - Production Deployment Guide

## 🌐 Your Live Site URLs

**Current Vercel Deployment:**
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app
```

**Or your custom domain (if configured):**
```
https://your-domain.com
```

---

## ⚠️ CRITICAL: Configure Production URLs

### Step 1: Set NEXTAUTH_URL Environment Variable

In **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add:
```
NEXTAUTH_URL=https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app
```

Or if you have a custom domain:
```
NEXTAUTH_URL=https://your-custom-domain.com
```

**This is required for NextAuth to work in production!**

---

## 🔗 Share These URLs with Your Remote Staff

### For Staff Registration:
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
```

### For Staff Login:
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login
```

### For Password Changes:
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/change-password
```

### For Admin Dashboard:
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin
```

---

## 📧 Email Template for Staff

Copy and send this to your team:

```
Subject: SUCCESS Magazine Admin Portal - Account Setup

Hi [Name],

Welcome to the SUCCESS Magazine admin portal! Here's how to get started:

1. REGISTER YOUR ACCOUNT
   Visit: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
   - Enter your @success.com email
   - Enter your full name
   - Select your role

2. YOU'LL RECEIVE TEMPORARY CREDENTIALS
   - Password: SUCCESS123!
   - You MUST change this on first login

3. LOGIN
   Visit: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login
   - Email: your.email@success.com
   - Password: SUCCESS123!

4. CHANGE YOUR PASSWORD (Required)
   - You'll be automatically redirected
   - Create a strong password (8+ characters, uppercase, lowercase, number)
   - DO NOT use SUCCESS123! as your new password

5. ACCESS ADMIN DASHBOARD
   - After changing password, you'll have full access
   - Bookmark: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin

IMPORTANT:
- Only @success.com emails are allowed
- You must change your password on first login
- Keep your new password secure

Questions? Contact Rachel.

Best regards,
Rachel Nead
SUCCESS Magazine
```

---

## 🛠️ How to Add Staff (For Rachel)

### Option 1: Send Registration Link
Share the registration URL with staff and they can self-register:
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
```

### Option 2: Add Via Script (Local Only)
From your local machine:
```bash
# Connect to production database
npx tsx scripts/add-staff-account.ts
```

**Note:** The script uses your DATABASE_URL from .env.production

---

## ✅ Pre-Deployment Checklist

Before sharing links with staff:

- [ ] Update `pages/api/auth/[...nextauth].ts` (see NEXTAUTH_UPDATE_NEEDED.md)
- [ ] Set `NEXTAUTH_URL` in Vercel environment variables
- [ ] Deploy the updated code to production
- [ ] Test registration on live site with a test account
- [ ] Test login flow on live site
- [ ] Test password change on live site
- [ ] Verify domain validation works (@success.com only)

---

## 🧪 Test on Production

### Create Test Account

1. Go to: `https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register`
2. Register with: `test.staff@success.com`
3. Note: You'll get password `SUCCESS123!`
4. Login at: `https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login`
5. Change password when prompted
6. Verify you can access admin dashboard

### Test Domain Validation

1. Try registering with `test@gmail.com`
2. Should see error: "Access restricted to SUCCESS Magazine staff (@success.com emails only)"

---

## 🚀 Deploy Updated Code

### Step 1: Commit Changes
```bash
git add .
git commit -m "Add staff authentication system with domain restriction"
git push
```

### Step 2: Vercel Auto-Deploys
Vercel will automatically deploy your changes.

### Step 3: Verify Deployment
Check: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app

---

## 🔐 Production Security Checklist

### Environment Variables (Vercel Dashboard)

Make sure these are set:
- [x] `DATABASE_URL` - Your production database
- [x] `NEXTAUTH_SECRET` - Your NextAuth secret
- [ ] `NEXTAUTH_URL` - **ADD THIS!** Your production URL

### Security Features Active

- ✅ Only @success.com emails allowed
- ✅ Default password `SUCCESS123!` required to change
- ✅ Strong password enforcement
- ✅ Forced password change on first login
- ✅ Session tracking
- ✅ Last login tracking

---

## 📱 Bookmarkable URLs for Staff

Your team should bookmark:

**Admin Dashboard:**
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin
```

**Change Password (if needed later):**
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/change-password
```

---

## 🎯 Staff Onboarding Flow

```
1. Rachel sends registration link to new staff member
   ↓
2. Staff visits registration page
   ↓
3. Staff enters @success.com email and name
   ↓
4. Account created with password: SUCCESS123!
   ↓
5. Staff visits login page
   ↓
6. Staff enters email + SUCCESS123!
   ↓
7. Redirected to change password page
   ↓
8. Staff creates strong new password
   ↓
9. Redirected to admin dashboard
   ↓
10. Full access granted ✅
```

---

## 🔑 Key Information for Staff

**Default Password:** `SUCCESS123!` (temporary, must change)
**Email Domain:** Must end with `@success.com`
**Password Requirements:**
- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Cannot be `SUCCESS123!`

**URLs:**
- Registration: `/register`
- Login: `/admin/login`
- Admin: `/admin`

---

## ⚠️ Important Notes

### For Remote Staff
- Everyone uses the same Vercel URL
- No need for localhost
- Works from anywhere with internet
- Just needs @success.com email

### For Rachel
- Your super admin account works on production
- You can add staff via script (connects to production DB)
- Or share registration link with staff

### Custom Domain (Optional)
If you configure a custom domain in Vercel (like `admin.success.com`):
1. Update `NEXTAUTH_URL` environment variable
2. Update all links in this document
3. Much easier to share with staff!

---

## 📞 Troubleshooting Production Issues

### Issue: "NextAuth Error: Configuration"
**Solution:** Set `NEXTAUTH_URL` in Vercel environment variables

### Issue: Staff can't register
**Solutions:**
- Verify they're using @success.com email
- Check Vercel deployment is successful
- Check database connection
- Check Vercel logs for errors

### Issue: Login redirects to wrong URL
**Solution:** Verify `NEXTAUTH_URL` is correct in Vercel

### Issue: Password change doesn't work
**Solutions:**
- Check browser console for errors
- Verify `/api/auth/change-password` endpoint is deployed
- Check Vercel function logs

---

## 🎉 Ready to Launch!

**Your Production URLs:**
- Registration: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
- Login: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login
- Admin: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin

**Next Steps:**
1. Set `NEXTAUTH_URL` in Vercel
2. Deploy your code changes
3. Test with a test account
4. Send registration link to your team!

---

**Need a custom domain?** Let me know and I can help you set it up in Vercel (e.g., `admin.successmagazine.com`)!
