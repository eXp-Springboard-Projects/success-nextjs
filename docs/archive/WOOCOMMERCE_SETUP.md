# WooCommerce Integration Setup Guide

## Overview
This guide will help you set up two-way order fulfillment sync between your Next.js admin panel and WooCommerce store at mysuccessplus.com/shop.

## Prerequisites
- Access to WooCommerce admin panel
- Database with fulfillment fields (migration already completed)
- Environment variables configured

---

## Step 1: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# WooCommerce Store URL (without /wp-json)
WOOCOMMERCE_STORE_URL=https://mysuccessplus.com

# WooCommerce REST API Credentials
# Get these from WooCommerce → Settings → Advanced → REST API
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Secret (generate a random string)
# Use this to verify webhook authenticity
WOOCOMMERCE_WEBHOOK_SECRET=your_random_secret_here_minimum_32_characters
```

**To generate a webhook secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2: Generate WooCommerce API Keys

1. Log into your WooCommerce admin panel
2. Go to **WooCommerce → Settings → Advanced → REST API**
3. Click **Add Key**
4. Fill in:
   - **Description:** "Next.js Admin Panel - Order Sync"
   - **User:** Select an admin user
   - **Permissions:** **Read/Write**
5. Click **Generate API Key**
6. Copy the **Consumer Key** and **Consumer Secret**
7. Add them to your `.env.local` file

---

## Step 3: Set Up WooCommerce Webhook

1. In WooCommerce admin, go to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Name:** "Next.js Order Sync"
   - **Status:** ✅ Active
   - **Topic:** **Order created**
   - **Delivery URL:** `https://yourdomain.com/api/webhooks/woocommerce/order-created`
   - **Secret:** Paste the `WOOCOMMERCE_WEBHOOK_SECRET` from your `.env.local`
   - **API Version:** **WP REST API Integration v3**
4. Click **Save Webhook**

---

## Step 4: Test the Integration

### Test 1: Verify Webhook Delivery

1. Create a test order in WooCommerce
2. Check the webhook delivery log:
   - Go to **WooCommerce → Settings → Advanced → Webhooks**
   - Click on your webhook
   - Scroll to **Deliveries** section
   - You should see a successful 200 response

3. Check your Next.js admin:
   - Go to `/admin/orders`
   - You should see the order with `orderSource: "WooCommerce"`

### Test 2: Mark Order as Fulfilled

1. In Next.js admin, go to `/admin/orders`
2. Find the test order
3. Click **Fulfill**
4. Add tracking information:
   - Carrier: USPS
   - Tracking Number: 1234567890
   - Tracking URL: https://tools.usps.com/go/TrackConfirmAction?tLabels=1234567890
5. Click **Mark as Fulfilled**

### Test 3: Verify Two-Way Sync

1. Go back to WooCommerce admin
2. Find the same order
3. Verify:
   - ✅ Order status changed to **Completed**
   - ✅ Order note added with tracking number
   - ✅ Customer received email notification

---

## Step 5: Configure Order Sources

The system automatically detects and tags orders by source:

| Source | Description |
|--------|-------------|
| **WooCommerce** | Orders from mysuccessplus.com/shop |
| **Stripe** | Direct Stripe checkout orders |
| **InHouse** | Manually created orders in admin |

Filter orders by source in `/admin/orders` using the dropdown.

---

## Features Overview

### ✅ Automatic Order Sync
- New WooCommerce orders automatically appear in admin
- Customer information synced
- Order items and products created/updated
- Transaction records created

### ✅ Two-Way Fulfillment Sync
- Mark order as fulfilled in admin → Updates WooCommerce
- Add tracking info in admin → Customer notified in WooCommerce
- Status changes sync both ways

### ✅ Bulk Fulfillment
- Select multiple orders with checkboxes
- Click "Fulfill X Selected"
- All orders marked as fulfilled and synced

### ✅ Packing Slips
- Click "Print" on any order
- Generates formatted packing slip
- Opens in new window for printing

### ✅ Tracking Management
- Add carrier (USPS, UPS, FedEx, DHL)
- Add tracking number
- Add tracking URL
- Automatically synced to WooCommerce

---

## Troubleshooting

### Webhook Not Receiving Orders

**Check 1:** Verify webhook is active
```bash
# In WooCommerce → Settings → Advanced → Webhooks
# Status should be green "Active"
```

**Check 2:** Verify delivery URL is correct
```bash
# Should be: https://yourdomain.com/api/webhooks/woocommerce/order-created
# NOT: http:// (must be https)
# NOT: localhost (WooCommerce can't reach localhost)
```

**Check 3:** Check webhook signature
```bash
# Make sure WOOCOMMERCE_WEBHOOK_SECRET matches in:
# 1. Your .env.local file
# 2. WooCommerce webhook settings
```

**Check 4:** View webhook delivery logs
```bash
# In WooCommerce webhook settings, scroll to "Deliveries"
# Look for error messages in the response
```

### Two-Way Sync Not Working

**Check 1:** Verify API credentials
```bash
# Test the connection with curl:
curl https://mysuccessplus.com/wp-json/wc/v3/orders \
  -u "consumer_key:consumer_secret"

# Should return a list of orders
# If you get 401 Unauthorized, your credentials are wrong
```

**Check 2:** Check API permissions
```bash
# API key must have Read/Write permissions
# Go to WooCommerce → Settings → Advanced → REST API
# Find your key and verify permissions
```

**Check 3:** Check server logs
```bash
# In your Next.js terminal, look for:
✅ Synced status to WooCommerce order #123
✅ Added tracking to WooCommerce order #123

# If you see errors, they'll appear here
```

### Orders Not Appearing in Admin

**Check 1:** Verify database migration ran
```bash
npm run tsx scripts/add-order-fulfillment-fields.ts
# Should see: ✅ Migration completed successfully!
```

**Check 2:** Check for duplicate emails
```bash
# The system creates members from WooCommerce customers
# If email already exists, it uses existing member
```

**Check 3:** Check order status
```bash
# Only orders with certain statuses are synced
# Supported: pending, processing, completed
# Not synced: draft, trash
```

---

## API Endpoints Reference

### Webhooks
- `POST /api/webhooks/woocommerce/order-created` - Receives new orders from WooCommerce

### Orders Management
- `GET /api/admin/orders` - List all orders with filters
- `POST /api/admin/orders/[id]/fulfill` - Mark order as fulfilled
- `POST /api/admin/orders/bulk-fulfill` - Bulk fulfill multiple orders

### Query Parameters
```bash
GET /api/admin/orders?
  status=PENDING&                    # Filter by order status
  orderSource=WooCommerce&           # Filter by source
  fulfillmentStatus=UNFULFILLED&     # Filter by fulfillment
  search=customer@email.com          # Search orders
```

---

## Database Schema

The orders table now includes these fulfillment fields:

```sql
ALTER TABLE orders
ADD COLUMN orderSource TEXT DEFAULT 'InHouse',
ADD COLUMN woocommerceOrderId INTEGER,
ADD COLUMN fulfillmentStatus TEXT DEFAULT 'UNFULFILLED',
ADD COLUMN fulfilledAt TIMESTAMP,
ADD COLUMN fulfilledBy TEXT,
ADD COLUMN trackingNumber TEXT,
ADD COLUMN trackingCarrier TEXT,
ADD COLUMN trackingUrl TEXT,
ADD COLUMN packingSlipPrinted BOOLEAN DEFAULT false,
ADD COLUMN internalNotes TEXT,
ADD COLUMN customerNotes TEXT;
```

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use HTTPS only** for webhook endpoints (WooCommerce requires this)
3. **Verify webhook signatures** (already implemented in code)
4. **Rotate API keys** every 90 days
5. **Use strong webhook secret** (minimum 32 characters)
6. **Limit API key permissions** to Read/Write only (not Read/Write/Delete)

---

## Next Steps

1. ✅ Configure environment variables
2. ✅ Generate WooCommerce API keys
3. ✅ Set up webhook
4. ✅ Test order sync
5. ✅ Test fulfillment sync
6. ✅ Train CS staff on new fulfillment UI

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review webhook delivery logs in WooCommerce
3. Check Next.js server console for errors
4. Verify all environment variables are correct

For production deployment:
- Ensure webhook URL uses HTTPS
- Test thoroughly in staging first
- Monitor webhook deliveries for first 24 hours
- Set up alerts for failed webhooks
