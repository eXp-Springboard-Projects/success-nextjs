# Data Import Directory

Place your WordPress export files in this directory for import.

## WordPress User Filter

Before importing WordPress users, use the filter script to reduce the dataset:

```bash
npx tsx scripts/filter-wp-users.ts data/wordpress-users.csv
```

This creates a filtered CSV containing only:
- Staff members (@success.com emails)
- Active subscribers (paid members)
- Users with login activity in the last 12 months

Output: `data/wordpress-users-filtered.csv`

## File Structure

```
data/
├── members.csv          # Active members and subscriptions
├── subscribers.csv      # Newsletter subscribers
├── products.json        # Store products and pricing
└── README.md           # This file
```

## Required Files

### 1. members.csv

Export active members with subscriptions from WordPress.

**Required columns:**
```
email,first_name,last_name,membership_tier,subscription_status,subscription_start,subscription_end,payment_method,stripe_customer_id
```

**Example row:**
```csv
john@example.com,John,Doe,PREMIUM,active,2024-01-15,2025-01-15,stripe,cus_abc123
```

**SQL Export Query:**
```sql
SELECT
  u.user_email as email,
  um1.meta_value as first_name,
  um2.meta_value as last_name,
  um3.meta_value as membership_tier,
  s.status as subscription_status,
  s.start_date as subscription_start,
  s.end_date as subscription_end,
  'stripe' as payment_method,
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

**Import command:**
```bash
npm run import:members
```

---

### 2. subscribers.csv

Export newsletter subscribers (NOT unsubscribed).

**Required columns:**
```
email,first_name,last_name,subscribed_date,source,tags
```

**Example row:**
```csv
jane@example.com,Jane,Smith,2024-01-01,newsletter,""
```

**SQL Export Query:**
```sql
SELECT
  email,
  name as first_name,
  surname as last_name,
  created as subscribed_date,
  'newsletter' as source,
  '' as tags
FROM wp_newsletter
WHERE status = 'C'
  AND unsub_email IS NULL
INTO OUTFILE '/tmp/subscribers.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

**Import command:**
```bash
npm run import:subscribers
```

---

### 3. products.json

Export active products from WooCommerce.

**Required format:**
```json
[
  {
    "wordpress_id": 123,
    "name": "SUCCESS+ Monthly",
    "slug": "success-plus-monthly",
    "price": 9.99,
    "sku": "SUCC-MONTHLY",
    "description": "Monthly SUCCESS+ subscription",
    "stripe_price_id": "price_xxx",
    "is_subscription": true,
    "billing_period": "monthly",
    "in_stock": true,
    "category": "Subscriptions"
  }
]
```

**WP-CLI Export Command:**
```bash
wp post list --post_type=product --post_status=publish --format=json > products.json
```

**Import command:**
```bash
npm run import:products
```

---

## Import Order

**IMPORTANT:** Run imports in this exact order:

```bash
# 1. Import members first (creates user accounts)
npm run import:members

# 2. Import newsletter subscribers (adds to contact list)
npm run import:subscribers

# 3. Import products (sets up store)
npm run import:products

# 4. Import blog content (via API)
npm run import:wordpress

# 5. Import categories/tags (via API)
npm run import:taxonomy

# 6. Verify everything imported correctly
npm run verify:import
```

---

## Data Validation

After importing, check:

- [ ] Members have valid emails
- [ ] Active members have Stripe customer IDs
- [ ] Subscribers added to "Newsletter Subscribers" list
- [ ] Products have prices and SKUs
- [ ] No duplicate emails

Run verification:
```bash
npm run verify:import
```

---

## Troubleshooting

**"File not found" error:**
- Ensure CSV/JSON files are in the `data/` directory
- Check file names match exactly (case-sensitive)

**"Duplicate email" error:**
- Clean data in WordPress before export
- Or manually remove duplicates from CSV

**"Invalid format" error:**
- Ensure CSV has headers in first row
- Check for proper quote escaping
- Validate JSON with `jq` or online validator

**Import taking too long:**
- Large imports run in batches
- Don't interrupt the process
- Check console for progress updates

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit CSV/JSON files to git
- This directory is in `.gitignore`
- Delete files after successful import
- CSV files may contain sensitive data (emails, Stripe IDs)

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run import:members` | Import active members & subscriptions |
| `npm run import:subscribers` | Import newsletter subscribers |
| `npm run import:products` | Import store products |
| `npm run import:taxonomy` | Import categories & tags |
| `npm run verify:import` | Verify all imports |

---

## Expected Results

After successful import:

- **Members:** 1,000 - 5,000
- **Subscribers:** 50,000 - 100,000
- **Products:** 10 - 50
- **Posts:** 500 - 2,000 (via import:wordpress)
- **Categories:** 10 - 20
- **Tags:** 50 - 200
