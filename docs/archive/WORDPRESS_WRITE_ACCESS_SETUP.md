# WordPress Application Password Setup Guide

## 🎯 Goal
Enable your Next.js admin to CREATE and EDIT WordPress content (posts, pages, videos, podcasts).

Currently: **Read-only** (can view but not edit)
After setup: **Full write access** (create, edit, delete)

---

## 📋 Prerequisites

- Access to wordpress.com admin dashboard
- SUCCESS.com WordPress site admin credentials
- 5 minutes

---

## 🔐 Step 1: Create Application Password in WordPress

### Option A: If You're Using WordPress.com

1. **Log in to WordPress.com**
   - Go to: https://wordpress.com/
   - Log in with your SUCCESS.com admin account

2. **Navigate to Applications Passwords**
   - Go to: https://wordpress.com/me/security/application-passwords
   - Or: Dashboard → Me → Security → Application Passwords

3. **Create New Application Password**
   - Click "Create New Application Password"
   - Application Name: `SUCCESS Next.js Admin`
   - Click "Generate Password"

4. **SAVE THE PASSWORD**
   - Copy the generated password immediately
   - Format: `xxxx xxxx xxxx xxxx xxxx xxxx` (24 characters with spaces)
   - **You won't be able to see it again!**

### Option B: If You're Using Self-Hosted WordPress

1. **Log in to WP Admin**
   - Go to: https://www.success.com/wp-admin
   - Log in with admin credentials

2. **Go to Your Profile**
   - Dashboard → Users → Profile
   - Or: Dashboard → Users → Your Username

3. **Scroll to Application Passwords Section**
   - At the bottom of your profile page
   - Section title: "Application Passwords"

4. **Create New Application Password**
   - New Application Password Name: `SUCCESS Next.js Admin`
   - Click "Add New Application Password"
   - **Copy the password immediately** (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)

---

## 🔧 Step 2: Add Credentials to Vercel Environment Variables

### In Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/
   - Navigate to your project: `success-nextjs`

2. **Open Environment Variables**
   - Click on your project
   - Settings → Environment Variables

3. **Add WordPress Credentials**

Add these three environment variables:

```
Name: WORDPRESS_USERNAME
Value: your-wordpress-admin-username
Environment: Production, Preview, Development
```

```
Name: WORDPRESS_APP_PASSWORD
Value: xxxx xxxx xxxx xxxx xxxx xxxx
Environment: Production, Preview, Development
```

```
Name: WORDPRESS_API_URL
Value: https://www.success.com/wp-json/wp/v2
Environment: Production, Preview, Development
```

4. **Save All Variables**

---

## 💻 Step 3: Add to Local Environment (Optional for Testing)

Create or update `.env.local`:

```bash
# WordPress Write Access
WORDPRESS_USERNAME=your-wordpress-admin-username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
WORDPRESS_API_URL=https://www.success.com/wp-json/wp/v2
```

**Note:** Never commit this file to git!

---

## 🚀 Step 4: Redeploy Your Application

### Trigger Vercel Redeploy

```bash
# Commit any pending changes
git add .
git commit -m "Add WordPress write access support"
git push
```

Or in Vercel Dashboard:
- Deployments → Latest Deployment → ⋮ (three dots) → Redeploy

---

## 🧪 Step 5: Test WordPress Write Access

### Test Creating a Post

1. **Log in to Admin**
   - Go to: `https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/login`
   - Use your @success.com staff credentials

2. **Create Test Post**
   - Admin → Posts → New Post
   - Title: `Test Post from Next.js Admin`
   - Content: `This is a test post created via the Next.js admin.`
   - Status: Draft
   - Click "Publish"

3. **Verify in WordPress**
   - Log in to wordpress.com admin
   - Go to Posts
   - You should see "Test Post from Next.js Admin" in Drafts

### Test Editing a Post

1. **In Next.js Admin**
   - Admin → Posts → Select any post
   - Click "Edit"
   - Make a small change
   - Click "Update"

2. **Verify in WordPress**
   - Check the post in WordPress admin
   - Changes should be reflected

---

## 🔍 Troubleshooting

### Issue: "Authentication failed"

**Solutions:**
1. Verify WordPress username is correct (usually your email or username)
2. Check Application Password has no typos (include spaces or remove them)
3. Make sure you copied the FULL password (24 characters)
4. Verify environment variables are set in Vercel
5. Try generating a new Application Password

### Issue: "Unauthorized - 401 error"

**Solutions:**
1. Check if Application Password is still active in WordPress
2. Verify `WORDPRESS_API_URL` is correct
3. Ensure your WordPress user has admin/editor permissions
4. Check if WordPress REST API is enabled (usually is by default)

### Issue: "Can create but not edit"

**Solutions:**
1. Check WordPress user role (needs editor or admin)
2. Verify the post you're trying to edit isn't locked by another user
3. Check WordPress permissions settings

### Issue: Environment variables not loading

**Solutions:**
1. Redeploy after adding variables
2. Check variables are added to all environments (Production, Preview, Development)
3. Wait 1-2 minutes after redeployment
4. Check browser console for errors

---

## 🔐 Security Best Practices

### Application Password Security

✅ **DO:**
- Create separate Application Passwords for different services
- Use descriptive names (`SUCCESS Next.js Admin`)
- Revoke passwords you're no longer using
- Store passwords in environment variables only
- Never commit passwords to git

❌ **DON'T:**
- Share Application Passwords between services
- Commit passwords to version control
- Use your main WordPress password
- Store passwords in plain text files

### Revoking Access

If compromised, immediately:
1. Log in to WordPress.com
2. Go to Security → Application Passwords
3. Find "SUCCESS Next.js Admin"
4. Click "Revoke"
5. Generate new password
6. Update Vercel environment variables

---

## 📊 What This Unlocks

After successful setup, your staff can:

### Content Creation
- ✅ Create new blog posts
- ✅ Create new pages
- ✅ Create videos
- ✅ Create podcasts
- ✅ Upload media to WordPress

### Content Editing
- ✅ Edit existing posts
- ✅ Edit existing pages
- ✅ Update video/podcast details
- ✅ Change post status (draft/published)
- ✅ Update categories and tags

### Content Management
- ✅ Delete content (with proper permissions)
- ✅ Schedule posts for future publishing
- ✅ Bulk operations
- ✅ Media management

### What You Get:
**40% more admin functionality** - transforms from read-only to full CMS!

---

## 🎉 Success Checklist

After setup, verify these work:

- [ ] Can create a new draft post in Next.js admin
- [ ] Post appears in WordPress admin
- [ ] Can edit an existing post from Next.js admin
- [ ] Changes reflect in WordPress
- [ ] Can change post status (draft → published)
- [ ] Can upload featured images
- [ ] Can add categories and tags
- [ ] No authentication errors in browser console

---

## 📞 Need Help?

### Common Issues Reference

**Error: "Application password authentication failed"**
→ Double-check username and password in Vercel

**Error: "REST API not found"**
→ Verify WORDPRESS_API_URL is correct

**Error: "Insufficient permissions"**
→ Check WordPress user has editor/admin role

**No errors but changes don't save**
→ Check browser console, verify API endpoints are working

---

## 🔑 Quick Reference

**WordPress.com Application Passwords:**
https://wordpress.com/me/security/application-passwords

**Self-Hosted WordPress:**
https://www.success.com/wp-admin/profile.php (scroll to Application Passwords)

**Vercel Environment Variables:**
https://vercel.com/rns-projects-2b157598/success-nextjs/settings/environment-variables

**Test Create Post:**
https://success-nextjs-1436i4ctz-rns-projects-2b157598.vercel.app/admin/posts/new

---

## ⏱️ Time Estimate

- Getting Application Password: 2 minutes
- Adding to Vercel: 3 minutes
- Redeployment: 2-5 minutes
- Testing: 5 minutes

**Total: ~15 minutes**

---

**After completing this setup, move on to email service configuration!**
