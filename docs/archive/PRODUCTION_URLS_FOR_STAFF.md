# 🌐 SUCCESS Magazine Admin Portal - Production URLs

## 📍 Live Site URLs (Share with Remote Staff)

### For New Staff - Registration
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
```

### For All Staff - Login
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login
```

### Admin Dashboard
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin
```

### Change Password
```
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/change-password
```

---

## 🔑 Login Credentials

**Default Password (for new accounts):**
```
SUCCESS123!
```

**Email Domain Requirement:**
```
Must end with @success.com
```

---

## 📧 Email Template to Send Staff

```
Subject: SUCCESS Magazine Admin Portal Access

Hi [Name],

You now have access to the SUCCESS Magazine admin portal!

🔗 REGISTRATION (New Staff)
Visit: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/register
- Use your @success.com email
- Enter your full name
- Select your role

🔑 TEMPORARY PASSWORD
After registration, use: SUCCESS123!

🔐 FIRST LOGIN
Visit: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login
- You'll be required to change your password immediately
- Create a strong password (8+ chars, uppercase, lowercase, number)

📊 ADMIN DASHBOARD
After password change: https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin

Questions? Contact Rachel.

Best,
Rachel
```

---

## ⚙️ Setup Required Before Sharing Links

### ⚠️ CRITICAL: Set Environment Variable in Vercel

**Vercel Dashboard** → **Settings** → **Environment Variables**

Add:
```
NEXTAUTH_URL=https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app
```

**Without this, authentication will not work!**

---

## ✅ Quick Test Checklist

Before sharing with staff:

1. [ ] Set `NEXTAUTH_URL` in Vercel
2. [ ] Deploy latest code
3. [ ] Update `pages/api/auth/[...nextauth].ts` (see NEXTAUTH_UPDATE_NEEDED.md)
4. [ ] Test registration at production URL
5. [ ] Test login at production URL
6. [ ] Test password change works
7. [ ] Verify @success.com domain restriction works

---

## 📱 Short URLs for Easy Sharing

**Registration:**
`/register`

**Login:**
`/admin/login`

**Dashboard:**
`/admin`

Base URL: `https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app`

---

## 🎯 Want a Shorter URL?

Consider adding a custom domain in Vercel like:
- `admin.successmagazine.com`
- `portal.successmagazine.com`
- `staff.successmagazine.com`

Much easier to share with your team!

---

**Save this file and share the URLs with your remote team!** 🚀
