# WordPress to Next.js Import Checklist

## ✅ CRITICAL DATA (Required for Launch)

### 1. Active Members & Subscriptions

**WordPress Tables:**
- `wp_users` (WHERE user_status = 0 AND has active subscription)
- `wp_usermeta` (subscription data, payment info)
- `wp_wc_subscriptions` (active subscriptions only)
- `wp_wc_subscriptions_orders` (recent orders)

**Export Format:** CSV

**Fields Needed:**
```csv
email,first_name,last_name,membership_tier,subscription_status,subscription_start,subscription_end,payment_method,stripe_customer_id,last_login
```

**Filter Criteria:**
- Subscription status: active, pending-cancel (NOT cancelled, expired)
- Last login: within 12 months
- Email verified: yes

**Script:** `scripts/import-members.ts`

---

### 2. Newsletter Subscribers

**WordPress Tables:**
- `wp_newsletter` or `wp_mailchimp_subscribers`
- Filter: status = confirmed, unsubscribed = 0

**Export Format:** CSV

**Fields Needed:**
```csv
email,first_name,last_name,subscribed_date,source,tags
```

**Filter Criteria:**
- Status: confirmed/subscribed
- NOT unsubscribed
- Email deliverable (no bounces)

**Script:** `scripts/import-subscribers.ts`

---

### 3. Active Products & Pricing

**WordPress Tables:**
- `wp_posts` (WHERE post_type = 'product' AND post_status = 'publish')
- `wp_postmeta` (product price, SKU, inventory)
- `wp_woocommerce_order_items`

**Export Format:** JSON

**Fields Needed:**
```json
{
  "id": "wordpress_id",
  "name": "Product Name",
  "slug": "product-slug",
  "price": 99.00,
  "sku": "SUCC-001",
  "description": "Product description",
  "stripe_price_id": "price_xxx",
  "is_subscription": true,
  "billing_period": "monthly"
}
```

**Filter Criteria:**
- Status: published
- In stock OR subscription product
- Has valid price

**Script:** `scripts/import-products.ts`

---

## 📊 IMPORTANT DATA (Launch Week)

### 4. Recent Blog Posts

**WordPress Tables:**
- `wp_posts` (WHERE post_type = 'post' AND post_status = 'publish')
- `wp_postmeta` (featured image, SEO data)
- `wp_term_relationships` (categories, tags)

**Export Format:** JSON (use WordPress REST API)

**API Endpoint:**
```
GET /wp-json/wp/v2/posts?per_page=100&page=1&_embed
```

**Filter Criteria:**
- Published in last 12 months
- Has featured image
- NOT drafts or private

**Script:** Already exists: `scripts/wordpress-import.ts`

---

### 5. Categories & Tags

**WordPress Tables:**
- `wp_terms`
- `wp_term_taxonomy` (WHERE taxonomy IN ('category', 'post_tag'))

**Export Format:** JSON (WordPress REST API)

**API Endpoint:**
```
GET /wp-json/wp/v2/categories?per_page=100
GET /wp-json/wp/v2/tags?per_page=100
```

**Script:** `scripts/import-taxonomy.ts`

---

## 🔄 OPTIONAL DATA (Post-Launch)

### 6. Comments (Optional)

**WordPress Tables:**
- `wp_comments` (WHERE comment_approved = 1 AND comment_date > '2024-01-01')

**Export Format:** CSV

**Filter:** Approved comments from last year only

**Script:** `scripts/import-comments.ts`

---

### 7. Page Views / Analytics (Optional)

**WordPress Tables:**
- Google Analytics export or WordPress stats plugin

**Export Format:** CSV

**Script:** Can skip - use Google Analytics directly

---

## 📋 EXPORT INSTRUCTIONS

### Step 1: Export Members (WP Admin)

```sql
-- Run in phpMyAdmin or WP-CLI
SELECT
  u.user_email as email,
  um1.meta_value as first_name,
  um2.meta_value as last_name,
  um3.meta_value as membership_tier,
  s.status as subscription_status,
  s.start_date as subscription_start,
  s.end_date as subscription_end,
  um4.meta_value as stripe_customer_id
FROM wp_users u
LEFT JOIN wp_usermeta um1 ON u.ID = um1.user_id AND um1.meta_key = 'first_name'
LEFT JOIN wp_usermeta um2 ON u.ID = um2.user_id AND um2.meta_key = 'last_name'
LEFT JOIN wp_usermeta um3 ON u.ID = um3.user_id AND um3.meta_key = 'membership_tier'
LEFT JOIN wp_usermeta um4 ON u.ID = um4.user_id AND um4.meta_key = '_stripe_customer_id'
LEFT JOIN wp_wc_subscriptions s ON u.ID = s.customer_id
WHERE s.status IN ('active', 'pending-cancel')
  AND u.user_status = 0
INTO OUTFILE '/tmp/members.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Step 2: Export Newsletter Subscribers

```sql
SELECT
  email,
  name as first_name,
  surname as last_name,
  created as subscribed_date,
  'newsletter' as source
FROM wp_newsletter
WHERE status = 'C'
  AND unsub_email IS NULL
INTO OUTFILE '/tmp/subscribers.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Step 3: Export via WP REST API (Recommended)

Use the existing WordPress API:
```bash
curl "https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?per_page=100&_embed" > posts.json
```

---

## 🚀 IMPORT ORDER

Run imports in this exact order:

1. **Members** - Creates user accounts and subscriptions
   ```bash
   npm run import:members
   ```

2. **Subscribers** - Adds to newsletter list
   ```bash
   npm run import:subscribers
   ```

3. **Products** - Sets up store pricing
   ```bash
   npm run import:products
   ```

4. **Posts** - Migrates blog content
   ```bash
   npm run import:wordpress
   ```

5. **Categories/Tags** - Blog taxonomy
   ```bash
   npm run import:taxonomy
   ```

---

## ⚠️ WHAT TO SKIP

**Do NOT import:**
- Cancelled subscriptions (older than 6 months)
- Unsubscribed email addresses
- Draft/unpublished posts
- Spam comments
- Old page views/stats
- Expired coupons
- Trashed/deleted content
- User session data
- Plugin settings/meta

---

## 📊 DATA VALIDATION

After import, verify:

```bash
# Check counts
npm run verify:import

# Expected results:
# - Members: 1000-5000
# - Subscribers: 50000-100000
# - Products: 10-50
# - Posts: 1000-2000
# - Categories: 10-20
```

---

## 🎯 MINIMUM VIABLE IMPORT

To launch, you ONLY need:

1. ✅ Active members (~2000)
2. ✅ Newsletter subscribers (~75000)
3. ✅ Current products (~15)
4. ✅ Recent posts (last 12 months, ~500)

Everything else can be imported post-launch.

**Estimated Import Time:** 2-3 hours total
