# Critical Flows Testing Guide

**Version:** 1.0
**Last Updated:** 2025-01-07
**Purpose:** Manual testing checklist for SUCCESS Magazine Next.js application

---

## Prerequisites

### Test Accounts Setup
- [ ] Admin account created: `admin@success.com` / `Admin123!`
- [ ] Test user account: `testuser@success.com` / `Test123!`
- [ ] Stripe test mode enabled (use test keys)
- [ ] PayKickstart test/sandbox mode enabled

### Database Access
```bash
# Connect to database to verify changes
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Required Tools
- Two browsers (one for admin, one for user testing)
- Incognito/private browsing windows
- Database viewer (Prisma Studio)
- API testing tool (optional: Postman/Insomnia)

### Environment Check
```bash
# Verify app is running
npm run dev
# Should be accessible at http://localhost:3000

# Check database connection
npx prisma db push
# Should show "Database is up to date"
```

---

## Flow 1: New User Registration & Login

### Test Scenario: Brand new user signs up and accesses their dashboard

#### Steps:

**1. Navigate to Sign Up Page**
- [ ] Open browser in incognito mode
- [ ] Go to `http://localhost:3000/login`
- [ ] Click "Sign Up" or "Create Account" link

**2. Fill Registration Form**
```
Name: Test User
Email: newuser+test1@gmail.com
Password: SecurePass123!
```
- [ ] Submit form
- [ ] **SUCCESS LOOKS LIKE:** Redirect to `/dashboard` or confirmation page
- [ ] **FAILURE POINT:** Check console for errors, verify email format is valid

**3. Verify Database Entry**
- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Navigate to `users` table
- [ ] Find user with email `newuser+test1@gmail.com`
- [ ] Verify fields:
  ```
  id: (auto-generated)
  email: newuser+test1@gmail.com
  name: Test User
  role: EDITOR (or USER)
  emailVerified: false (or true if auto-verified)
  subscriptionStatus: INACTIVE
  createdAt: (recent timestamp)
  ```

**4. Login with New Account**
- [ ] Logout (if logged in)
- [ ] Go to `http://localhost:3000/login`
- [ ] Enter credentials:
  ```
  Email: newuser+test1@gmail.com
  Password: SecurePass123!
  ```
- [ ] Click "Sign In"
- [ ] **SUCCESS:** Redirected to `/dashboard`
- [ ] **VERIFY:** Username/email appears in header or nav

**5. Verify Dashboard Access**
- [ ] Dashboard displays user's name
- [ ] Subscription status shows "Free" or "No Active Subscription"
- [ ] Access to basic features (reading articles, bookmarking)
- [ ] NO access to premium content (should see upgrade prompt)

**6. Test Session Persistence**
- [ ] Close browser tab (don't logout)
- [ ] Reopen `http://localhost:3000`
- [ ] **SUCCESS:** Still logged in
- [ ] Navigate to `/dashboard` - should work without login

**7. Test Logout**
- [ ] Click "Logout" button
- [ ] **SUCCESS:** Redirected to homepage or login
- [ ] Try to access `/dashboard` - should redirect to login

### Database Tables to Verify
```sql
-- Check users table
SELECT id, email, name, role, subscriptionStatus FROM users
WHERE email = 'newuser+test1@gmail.com';

-- Check sessions table (if using database sessions)
SELECT * FROM sessions WHERE userId = '<user-id-from-above>';
```

### Common Failure Points
❌ **"Email already exists"** → User already registered, use different email
❌ **"Invalid credentials"** → Check password meets requirements (8+ chars, etc.)
❌ **Redirect loop** → Check NEXTAUTH_URL in .env.local
❌ **Not staying logged in** → Check NEXTAUTH_SECRET is set
❌ **Dashboard shows wrong user** → Clear browser cookies and retry

---

## Flow 2: PayKickstart Subscription Purchase

### Test Scenario: User subscribes via PayKickstart, webhook creates subscription

#### Steps:

**1. Setup PayKickstart Test Environment**
- [ ] Log into PayKickstart dashboard
- [ ] Enable test/sandbox mode
- [ ] Create test product "SUCCESS+ Monthly" ($10/month)
- [ ] Copy product checkout URL

**2. User Clicks Subscribe Button**
- [ ] Login as test user: `testuser@success.com`
- [ ] Navigate to `/success-plus` or `/subscribe`
- [ ] Click "Subscribe Now" button
- [ ] **SUCCESS:** Opens PayKickstart checkout page (new tab or overlay)
- [ ] **FAILURE:** Check `PAYKICKSTART_VENDOR_ID` environment variable

**3. Complete PayKickstart Checkout**
- [ ] Fill test card details:
  ```
  Card: 4242 4242 4242 4242
  Expiry: 12/25
  CVC: 123
  Zip: 12345
  ```
- [ ] Complete checkout form
- [ ] Submit payment
- [ ] **SUCCESS:** "Payment Successful" confirmation page
- [ ] **NOTE:** Copy transaction/subscription ID if shown

**4. Wait for Webhook (5-30 seconds)**
- [ ] PayKickstart sends `subscription_created` webhook
- [ ] Check Vercel logs or local console for:
  ```
  PayKickstart webhook received: subscription_created
  Subscription created for user testuser@success.com: sub_xxxxx
  ```

**5. Verify Database - Subscriptions Table**
- [ ] Open Prisma Studio
- [ ] Go to `subscriptions` table
- [ ] Find subscription with `paykickstartSubscriptionId`
- [ ] Verify fields:
  ```
  provider: "paykickstart"
  status: "active"
  tier: "SUCCESS_PLUS"
  userId: (should match test user)
  paykickstartCustomerId: (from webhook)
  paykickstartSubscriptionId: (from webhook)
  currentPeriodStart: (today)
  currentPeriodEnd: (30 days from now)
  ```

**6. Verify Database - Users Table**
- [ ] Check `users` table for test user
- [ ] Verify updated fields:
  ```
  subscriptionStatus: "ACTIVE"
  subscriptionExpiry: (30 days from now)
  ```

**7. Verify Database - Activity Logs**
- [ ] Go to `activity_logs` table
- [ ] Find log with:
  ```
  action: "SUBSCRIPTION_CREATED"
  entity: "subscription"
  userId: (test user ID)
  details: (JSON with subscription info)
  ```

**8. Test Premium Access**
- [ ] Refresh browser (or logout and login again)
- [ ] Navigate to `/dashboard`
- [ ] **SUCCESS:** Shows "SUCCESS+ Member" or "Active Subscription"
- [ ] Try to access premium article
- [ ] **SUCCESS:** Full article content visible (no paywall)

**9. Test Subscription Management**
- [ ] Go to `/dashboard` or `/account`
- [ ] Find "Manage Subscription" section
- [ ] **SHOWS:**
  - Subscription tier: SUCCESS+
  - Status: Active
  - Next billing date
  - Cancel/update options

### Manual Webhook Testing (If PayKickstart Doesn't Fire)

```bash
# Send test webhook manually using curl
curl -X POST http://localhost:3000/api/paykickstart/webhook \
  -H "Content-Type: application/json" \
  -H "x-paykickstart-signature: test-signature" \
  -d '{
    "event_type": "subscription_created",
    "data": {
      "subscription_id": "test_sub_12345",
      "customer_id": "test_cus_67890",
      "customer_email": "testuser@success.com",
      "product_name": "SUCCESS Plus Monthly",
      "status": "active",
      "billing_cycle": "monthly",
      "current_period_start": 1704672000,
      "current_period_end": 1707264000
    }
  }'
```

### Database Queries to Verify
```sql
-- Find subscription for test user
SELECT s.*, u.email
FROM subscriptions s
JOIN users u ON s.userId = u.id
WHERE u.email = 'testuser@success.com';

-- Check activity logs
SELECT * FROM activity_logs
WHERE action = 'SUBSCRIPTION_CREATED'
ORDER BY createdAt DESC
LIMIT 5;
```

### Common Failure Points
❌ **Webhook never arrives** → Check PayKickstart webhook URL is correct
❌ **"Invalid signature"** → Verify `PAYKICKSTART_WEBHOOK_SECRET` matches
❌ **User not found** → Webhook creates new user if email doesn't exist
❌ **Subscription not showing** → Clear cache, logout/login again
❌ **Still seeing paywall** → Check subscription status and tier mapping

---

## Flow 3: PayLink Creation & Payment

### Test Scenario: Admin creates PayLink, user completes Stripe payment

#### Steps:

**1. Login as Admin**
- [ ] Open browser
- [ ] Go to `http://localhost:3000/login`
- [ ] Login with admin credentials:
  ```
  Email: admin@success.com
  Password: Admin123!
  ```
- [ ] Verify redirect to `/admin`

**2. Navigate to PayLinks Admin**
- [ ] Click "PayLinks" in admin sidebar
- [ ] OR navigate to `http://localhost:3000/admin/paylinks`
- [ ] **SUCCESS:** See list of existing PayLinks (may be empty)

**3. Create New PayLink**
- [ ] Click "Create New PayLink" button
- [ ] Fill form:
  ```
  Title: Test Product - SUCCESS T-Shirt
  Description: Official SUCCESS Magazine branded t-shirt
  Amount: 29.99
  Currency: USD
  Slug: success-tshirt-test
  Max Uses: 100 (optional)
  Expires At: (leave blank or set future date)
  Requires Shipping: true
  ```
- [ ] Click "Create PayLink"
- [ ] **SUCCESS:** Redirected to PayLinks list
- [ ] **VERIFY:** New PayLink appears in list

**4. Verify Database - PayLinks Table**
- [ ] Open Prisma Studio
- [ ] Navigate to `pay_links` table
- [ ] Find PayLink with slug `success-tshirt-test`
- [ ] Verify fields:
  ```
  title: "Test Product - SUCCESS T-Shirt"
  amount: 29.99
  status: "ACTIVE"
  stripePriceId: (should be set if Stripe configured)
  stripeProductId: (should be set)
  currentUses: 0
  maxUses: 100
  ```

**5. Copy PayLink URL**
- [ ] In admin PayLinks list, find the new PayLink
- [ ] Copy the public URL, should be:
  ```
  http://localhost:3000/pay/success-tshirt-test
  ```
- [ ] OR copy the full checkout link if displayed

**6. Test PayLink as Customer (Incognito)**
- [ ] Open new INCOGNITO/PRIVATE browser window
- [ ] Paste PayLink URL: `http://localhost:3000/pay/success-tshirt-test`
- [ ] **SUCCESS:** Payment page loads with product details
- [ ] **VERIFY:** Shows correct title, amount, description

**7. Complete Stripe Test Payment**
- [ ] Fill payment form:
  ```
  Email: customer@example.com
  Card Number: 4242 4242 4242 4242
  Expiry: 12/25
  CVC: 123
  Name: Test Customer

  (If shipping required)
  Address: 123 Test St
  City: Los Angeles
  State: CA
  Zip: 90001
  ```
- [ ] Click "Pay $29.99"
- [ ] **SUCCESS:** Redirected to success page
- [ ] **SHOWS:** "Payment Successful" message

**8. Wait for Stripe Webhook (2-10 seconds)**
- [ ] Check console/logs for:
  ```
  Stripe webhook received: checkout.session.completed
  Payment successful for PayLink: success-tshirt-test
  ```

**9. Verify Admin Dashboard Updated**
- [ ] Go back to admin browser
- [ ] Refresh `/admin/paylinks` page
- [ ] Find the test PayLink
- [ ] **VERIFY:**
  - Current Uses: 1 (incremented)
  - Shows recent payment in transactions list

**10. Verify Database - PayLinks Updated**
- [ ] Prisma Studio → `pay_links` table
- [ ] Find `success-tshirt-test` PayLink
- [ ] Verify:
  ```
  currentUses: 1 (incremented from 0)
  updatedAt: (recent timestamp)
  ```

**11. Verify Database - Orders Table (If Implemented)**
- [ ] Check `orders` table for new order
- [ ] Should contain:
  ```
  userEmail: customer@example.com
  total: 29.99
  status: COMPLETED
  paymentMethod: stripe
  paymentId: (Stripe payment intent ID)
  shippingAddress: (if shipping required)
  ```

**12. Test PayLink Expiration (Optional)**
- [ ] Go back to admin PayLinks editor
- [ ] Edit the test PayLink
- [ ] Set `Max Uses: 1` (already reached)
- [ ] Save
- [ ] In incognito, try to access PayLink again
- [ ] **SUCCESS:** Shows "This PayLink has reached its maximum uses" error

**13. Test PayLink Deletion**
- [ ] In admin, click "Delete" on test PayLink
- [ ] Confirm deletion
- [ ] **VERIFY:** Removed from list
- [ ] Try to access URL in incognito
- [ ] **SUCCESS:** Shows "PayLink not found" or 404

### Manual Stripe Webhook Testing

```bash
# Test Stripe webhook locally
stripe trigger checkout.session.completed
```

### Database Queries to Verify
```sql
-- Find PayLink by slug
SELECT * FROM pay_links WHERE slug = 'success-tshirt-test';

-- Find associated orders
SELECT * FROM orders WHERE notes LIKE '%success-tshirt-test%'
ORDER BY createdAt DESC;

-- Check payment activity logs
SELECT * FROM activity_logs
WHERE action = 'PAYMENT_SUCCEEDED'
ORDER BY createdAt DESC
LIMIT 10;
```

### Common Failure Points
❌ **Stripe product creation fails** → Check `STRIPE_SECRET_KEY` is set
❌ **Payment page doesn't load** → Check slug is URL-safe (no spaces)
❌ **Webhook doesn't fire** → Verify `STRIPE_WEBHOOK_SECRET` is correct
❌ **Uses don't increment** → Check webhook handler is processing correctly
❌ **Can't delete PayLink** → May have associated orders (soft delete instead)

---

## Flow 4: Admin Dashboard Operations

### Test Scenario: Admin manages users, subscriptions, and content

#### Steps:

**1. Admin Login & Dashboard Overview**
- [ ] Login as admin: `admin@success.com`
- [ ] Navigate to `http://localhost:3000/admin`
- [ ] **VERIFY Dashboard Shows:**
  - Total users count
  - Active subscriptions count
  - Revenue metrics (if configured)
  - Recent activity feed
  - Quick links to manage sections

**2. View Members List**
- [ ] Click "Members" in sidebar
- [ ] OR go to `http://localhost:3000/admin/members`
- [ ] **SUCCESS:** Table of all users displays
- [ ] **VERIFY COLUMNS:**
  - Name
  - Email
  - Subscription Status (Active/Inactive/Canceled)
  - Role (Admin/Editor/Author)
  - Joined Date
  - Actions (View/Edit/Delete)

**3. Search/Filter Members**
- [ ] Use search box to find test user
- [ ] Enter: `testuser@success.com`
- [ ] **SUCCESS:** Only matching users shown
- [ ] Clear search, try filtering by subscription status
- [ ] Select "Active" filter
- [ ] **SUCCESS:** Only active subscribers shown

**4. View Individual Member Details**
- [ ] Click "View" on test user row
- [ ] OR navigate to `/admin/members/{user-id}`
- [ ] **VERIFY DETAILS PAGE SHOWS:**
  - User profile info (name, email, avatar)
  - Subscription details (tier, status, dates)
  - Activity history (logins, articles read, bookmarks)
  - Payment history (if any)
  - Actions: Edit, Suspend, Delete

**5. Edit Member Subscription**
- [ ] On member detail page, click "Edit Subscription"
- [ ] Change subscription status to "CANCELED"
- [ ] Save changes
- [ ] **VERIFY:**
  - Status updates in database
  - Activity log records the change
  - User loses premium access (test by logging in as that user)

**6. View Subscriptions Dashboard**
- [ ] Navigate to `http://localhost:3000/admin/subscriptions`
- [ ] **SUCCESS:** List of all subscriptions
- [ ] **VERIFY SHOWS:**
  - Subscriber name/email
  - Plan (SUCCESS+ Monthly/Annual)
  - Status (Active/Canceled/Past Due)
  - Next billing date
  - Actions (View, Cancel, Refund)

**7. Filter Subscriptions by Status**
- [ ] Select "Active" filter
- [ ] **SUCCESS:** Only active subs shown
- [ ] Try "Canceled" filter
- [ ] Try "Past Due" filter
- [ ] **VERIFY:** Counts match dashboard overview

**8. View PayLinks Management**
- [ ] Navigate to `http://localhost:3000/admin/paylinks`
- [ ] **VERIFY TABLE SHOWS:**
  - PayLink title
  - Slug
  - Amount
  - Status (Active/Inactive/Expired)
  - Current Uses / Max Uses
  - Created Date
  - Actions (Edit, View Stats, Delete)

**9. View PayLink Statistics**
- [ ] Click "Stats" button on a PayLink with uses
- [ ] **SUCCESS:** Stats page loads
- [ ] **VERIFY SHOWS:**
  - Total clicks/views
  - Total conversions (payments)
  - Revenue generated
  - Conversion rate
  - Recent transactions list

**10. Create Draft Post (If WordPress Sync Configured)**
- [ ] Go to `http://localhost:3000/admin/posts`
- [ ] Click "Create New Post"
- [ ] Fill form:
  ```
  Title: Test Article from Admin
  Slug: test-article-admin
  Content: This is a test article created from Next.js admin.
  Category: Business
  Status: DRAFT
  ```
- [ ] Click "Save Draft"
- [ ] **SUCCESS:** Post created, appears in posts list

**11. Verify Database - Posts Table**
- [ ] Prisma Studio → `posts` table
- [ ] Find post with slug `test-article-admin`
- [ ] Verify:
  ```
  status: DRAFT
  authorId: (admin user ID)
  createdAt: (recent timestamp)
  ```

**12. Test User Role Management**
- [ ] Go to `http://localhost:3000/admin/users`
- [ ] Find a test user
- [ ] Click "Edit"
- [ ] Change role from EDITOR to AUTHOR
- [ ] Save
- [ ] **VERIFY:**
  - Database `users` table shows updated role
  - Activity log records the change
  - User's permissions change (test by logging in as that user)

### Database Queries to Verify
```sql
-- Count users by subscription status
SELECT subscriptionStatus, COUNT(*)
FROM users
GROUP BY subscriptionStatus;

-- Find recent subscriptions
SELECT s.*, u.email
FROM subscriptions s
JOIN users u ON s.userId = u.id
WHERE s.status = 'active'
ORDER BY s.createdAt DESC
LIMIT 10;

-- Check admin activity logs
SELECT * FROM activity_logs
WHERE userId = '<admin-user-id>'
ORDER BY createdAt DESC
LIMIT 20;
```

### Common Failure Points
❌ **"Unauthorized" accessing /admin** → Check user role is ADMIN or SUPER_ADMIN
❌ **Members list doesn't load** → Check database connection, verify users table has data
❌ **Can't edit subscriptions** → Verify admin permissions, check API endpoints
❌ **Stats page blank** → Ensure PayLink has actual uses/payments
❌ **Post creation fails** → Check WordPress API credentials if syncing to WP

---

## Flow 5: WordPress Content Sync

### Test Scenario: Manual WordPress sync pulls latest posts to Next.js

#### Steps:

**1. Check Current Post Count**
- [ ] Navigate to homepage: `http://localhost:3000`
- [ ] Note the number of posts visible
- [ ] Note the date of the most recent post
- [ ] **EXAMPLE:** "5 posts, latest from Jan 5, 2025"

**2. Verify WordPress API Access**
- [ ] Open new tab
- [ ] Visit: `https://www.success.com/wp-json/wp/v2/posts?per_page=5`
- [ ] **SUCCESS:** JSON data loads with recent posts
- [ ] **FAILURE:** Check CORS, API availability

**3. Navigate to WordPress Sync Admin**
- [ ] Login as admin
- [ ] Go to `http://localhost:3000/admin/wordpress-sync`
- [ ] **VERIFY PAGE SHOWS:**
  - "Last Sync" timestamp
  - "Sync Status" (Idle/In Progress/Failed)
  - "Sync Now" button
  - Sync logs/history table

**4. View Current Sync Status**
- [ ] Check "Last Sync" date/time
- [ ] Check sync stats:
  ```
  Posts Synced: XXX
  Categories Synced: XX
  Authors Synced: XX
  Last Sync Duration: X minutes
  ```

**5. Start Manual Sync**
- [ ] Click "Sync Now" button
- [ ] **SUCCESS:** Button changes to "Syncing..."
- [ ] Progress indicator appears (loading spinner or progress bar)
- [ ] **VERIFY IN REAL-TIME:**
  - Console shows sync events:
    ```
    Starting WordPress sync...
    Fetching posts... 100/500
    Fetching categories... 10/15
    Syncing authors... 5/25
    Sync completed successfully
    ```

**6. Monitor Sync Progress**
- [ ] Wait for sync to complete (1-5 minutes depending on content volume)
- [ ] **SUCCESS INDICATORS:**
  - "Sync Status" changes to "Completed"
  - "Last Sync" timestamp updates to current time
  - Stats show updated counts

**7. Check Sync Logs**
- [ ] Scroll down to "Sync Logs" section
- [ ] **VERIFY LATEST LOG SHOWS:**
  ```
  Status: SUCCESS
  Started: [timestamp]
  Completed: [timestamp]
  Duration: X minutes
  Posts Added: XX
  Posts Updated: XX
  Categories Added: X
  Authors Added: X
  Errors: 0
  ```

**8. Verify Database - Posts Table**
- [ ] Open Prisma Studio
- [ ] Navigate to `posts` table
- [ ] Sort by `createdAt` descending
- [ ] **VERIFY:**
  - New posts appear with recent timestamps
  - Post content populated
  - Featured images have URLs
  - Categories are linked

**9. Verify Database - Categories Table**
- [ ] Check `categories` table
- [ ] **VERIFY:**
  - All WordPress categories present
  - Slug matches WordPress
  - Description populated (if available)

**10. Verify Database - Activity Logs**
- [ ] Check `activity_logs` table
- [ ] Find log with:
  ```
  action: "WORDPRESS_SYNC_COMPLETED"
  entity: "wordpress_sync"
  userId: (admin ID)
  details: (JSON with sync stats)
  ```

**11. Verify Homepage Updated**
- [ ] Navigate back to homepage: `http://localhost:3000`
- [ ] Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- [ ] **VERIFY:**
  - Latest WordPress posts now visible
  - Post dates match WordPress
  - Featured images display correctly
  - Categories link correctly

**12. Verify Individual Post Page**
- [ ] Click on one of the newly synced posts
- [ ] Navigate to `/blog/{post-slug}`
- [ ] **VERIFY:**
  - Full post content displays
  - Author info shown correctly
  - Categories and tags present
  - Comments section appears (if enabled)
  - Related posts section populated

**13. Test Category Pages**
- [ ] Navigate to a category page: `/category/business`
- [ ] **VERIFY:**
  - Posts from that category display
  - Pagination works (if >10 posts)
  - Category name/description shows

**14. Test Automatic Sync (Cron)**
- [ ] Check if cron job is configured in Vercel
- [ ] OR manually trigger: `http://localhost:3000/api/cron/hourly-sync`
- [ ] Add header: `Authorization: Bearer {CRON_SECRET}`
- [ ] **SUCCESS:** Returns `{"success": true, "message": "Sync started"}`

**15. Test Error Handling**
- [ ] Temporarily change `WORDPRESS_API_URL` to invalid URL
- [ ] Try "Sync Now" again
- [ ] **VERIFY ERROR HANDLING:**
  - Status shows "Failed"
  - Error message displayed
  - Sync log records the error
  - Previous data not corrupted

**16. Restore and Re-Sync**
- [ ] Fix `WORDPRESS_API_URL` back to correct value
- [ ] Run "Sync Now" again
- [ ] **SUCCESS:** Sync completes successfully

### Manual API Testing

```bash
# Test sync endpoint directly
curl -X POST http://localhost:3000/api/sync/wordpress \
  -H "Authorization: Bearer {CRON_SECRET}" \
  -H "Content-Type: application/json"

# Check sync status
curl http://localhost:3000/api/sync/status
```

### Database Queries to Verify
```sql
-- Count posts synced in last hour
SELECT COUNT(*) FROM posts
WHERE createdAt > NOW() - INTERVAL '1 hour';

-- Find posts missing featured images (to debug sync issues)
SELECT id, title, slug FROM posts
WHERE featuredImage IS NULL OR featuredImage = '';

-- Check sync activity logs
SELECT * FROM activity_logs
WHERE action LIKE '%SYNC%'
ORDER BY createdAt DESC
LIMIT 10;

-- Verify categories are linked to posts
SELECT c.name, COUNT(p.id) as post_count
FROM categories c
LEFT JOIN posts p ON c.id = ANY(p.categories)
GROUP BY c.id, c.name;
```

### Common Failure Points
❌ **"WordPress API unreachable"** → Check `WORDPRESS_API_URL` is correct and accessible
❌ **"401 Unauthorized"** → Verify `WORDPRESS_USERNAME` and `WORDPRESS_APP_PASSWORD` for write operations
❌ **Sync hangs/times out** → Check Vercel function timeout limits (max 10s on Hobby, 60s on Pro)
❌ **Images don't load** → Check image domains in `next.config.js`, verify CORS
❌ **Categories not linking** → Check category ID mapping, verify `_embed` parameter in API calls
❌ **Duplicate posts** → Check upsert logic in sync handler, verify slug uniqueness

---

## Post-Testing Validation

### After completing all flows, verify:

#### Database Integrity
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM subscriptions WHERE userId NOT IN (SELECT id FROM users);

-- Verify all subscriptions have activity logs
SELECT COUNT(*) FROM subscriptions s
LEFT JOIN activity_logs l ON l.entityId = s.id AND l.entity = 'subscription'
WHERE l.id IS NULL;

-- Check for users with subscriptions but wrong status
SELECT u.email, u.subscriptionStatus, s.status
FROM users u
JOIN subscriptions s ON s.userId = u.id
WHERE u.subscriptionStatus != s.status;
```

#### Application Health
- [ ] No console errors on any page
- [ ] All images load correctly
- [ ] Navigation works smoothly
- [ ] Forms submit successfully
- [ ] API endpoints respond < 2 seconds

#### Security Checks
- [ ] Admin pages require authentication
- [ ] Non-admin users can't access `/admin/*`
- [ ] API endpoints validate user roles
- [ ] Webhooks verify signatures
- [ ] Sensitive data not exposed in client

---

## Troubleshooting Guide

### "Can't connect to database"
1. Check `DATABASE_URL` in `.env.local`
2. Verify database is running (if local)
3. Run `npx prisma db push` to create tables
4. Check Prisma Client is generated: `npx prisma generate`

### "Webhook not received"
1. Check webhook URL is publicly accessible (use ngrok for local testing)
2. Verify webhook secret matches in both platforms
3. Check Vercel function logs for incoming requests
4. Test webhook manually with curl

### "Subscription not activating"
1. Check `subscriptions` table has record
2. Verify `users` table `subscriptionStatus` is updated
3. Clear browser cache and re-login
4. Check if subscription tier is correctly mapped

### "WordPress sync fails"
1. Test API endpoint directly in browser
2. Check CORS headers allow your domain
3. Verify SSL certificate is valid
4. Check for rate limiting (WordPress may throttle requests)

### "Payment not completing"
1. Verify test card numbers are correct (4242... for Stripe)
2. Check Stripe/PayKickstart is in test mode
3. Verify webhook endpoints are configured
4. Check browser console for JavaScript errors

---

## Test Results Template

Copy this template for each testing session:

```
TEST SESSION REPORT
==================
Date: _____________
Tester: _____________
Environment: [ ] Local [ ] Staging [ ] Production
Build Version: _____________

FLOW 1: New User Registration
✅ Registration form works
✅ User created in database
✅ Login successful
✅ Dashboard accessible
✅ Session persists
❌ Issues found: _____________

FLOW 2: PayKickstart Subscription
✅ Checkout page loads
✅ Payment completes
✅ Webhook received
✅ Subscription created
✅ Premium access granted
❌ Issues found: _____________

FLOW 3: PayLink Payment
✅ PayLink created successfully
✅ Payment page accessible
✅ Stripe payment completes
✅ Webhook updates database
✅ Admin dashboard updates
❌ Issues found: _____________

FLOW 4: Admin Dashboard
✅ Members list loads
✅ Subscription management works
✅ PayLinks management functional
✅ Post creation works
✅ User role management works
❌ Issues found: _____________

FLOW 5: WordPress Sync
✅ Manual sync completes
✅ Posts appear on homepage
✅ Individual posts load
✅ Categories work correctly
✅ Sync logs accurate
❌ Issues found: _____________

OVERALL STATUS: [ ] PASS [ ] FAIL
BLOCKER ISSUES: _____________
READY FOR PRODUCTION: [ ] YES [ ] NO

Next Steps:
- _____________
- _____________
- _____________
```

---

## Sign-Off

After all tests pass:
- [ ] All 5 critical flows tested and passing
- [ ] Database queries verified
- [ ] No console errors
- [ ] Performance acceptable (< 3s page loads)
- [ ] Security checks passed
- [ ] Test results documented

**Tested By:** _______________
**Date:** _______________
**Status:** [ ] APPROVED FOR PRODUCTION [ ] NEEDS FIXES
**Notes:** _______________________________________________
