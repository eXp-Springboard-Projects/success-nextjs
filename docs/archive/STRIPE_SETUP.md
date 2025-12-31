# Stripe Integration Setup Guide

Complete guide for setting up SUCCESS+ payment processing with Stripe.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Stripe Dashboard Setup](#stripe-dashboard-setup)
4. [Testing](#testing)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Stripe account (create at https://stripe.com)
- Node.js 18+ and npm installed
- Database configured and running
- SUCCESS+ application running locally

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (from Stripe CLI or Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create products first in Stripe Dashboard)
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_YEARLY=price_your_yearly_price_id

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Getting Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Click "Reveal test key" and copy **Secret key** → `STRIPE_SECRET_KEY`

---

## Stripe Dashboard Setup

### Step 1: Create Products

1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Add Product"

#### Monthly Product
- **Name**: SUCCESS+ Monthly
- **Description**: Full access to SUCCESS+ premium content, tools, and resources
- **Pricing**: $7.99 USD / month (Recurring)
- **Billing period**: Monthly
- Click "Save product"
- Copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_MONTHLY`

#### Annual Product
- **Name**: SUCCESS+ Annual
- **Description**: Full access to SUCCESS+ premium content, tools, and resources
- **Pricing**: $79.99 USD / year (Recurring)
- **Billing period**: Yearly
- Click "Save product"
- Copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_YEARLY`

### Step 2: Enable Customer Portal

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Click "Activate test link"
3. Configure settings:
   - **Allow customers to**: Update payment methods, cancel subscriptions
   - **Cancellation behavior**: Cancel immediately or at period end
   - **Invoice history**: Show all invoices
4. Click "Save changes"

### Step 3: Set Up Webhooks

#### For Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe:
   ```bash
   stripe login
   ```
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

#### For Production (using Dashboard)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Testing

### Test Credit Cards

Use these test cards in Stripe test mode:

| Card Number         | Scenario                    |
|---------------------|-----------------------------|
| 4242 4242 4242 4242 | Successful payment          |
| 4000 0000 0000 0002 | Payment declined            |
| 4000 0000 0000 9995 | Insufficient funds          |
| 4000 0025 0000 3155 | Authentication required     |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Testing the Flow

#### 1. Test Free Trial Signup
```bash
# Visit signup page
http://localhost:3000/signup/trial

# Fill out form with test email
# Check database for trial user creation
```

#### 2. Test Monthly Subscription
```bash
# Visit upgrade page
http://localhost:3000/success-plus/upgrade

# Click "Subscribe Monthly"
# Complete checkout with test card: 4242 4242 4242 4242
# Verify redirect to success page
# Check webhook logs in Stripe CLI
```

#### 3. Test Annual Subscription
```bash
# Same as monthly, but click "Subscribe Annually"
```

#### 4. Test Customer Portal
```bash
# Visit account page
http://localhost:3000/success-plus/account

# Click "Manage Billing"
# Verify redirect to Stripe Customer Portal
# Test updating payment method
# Test canceling subscription
```

#### 5. Test Webhook Events

Monitor webhooks with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Trigger test events:
```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test failed payment
stripe trigger invoice.payment_failed
```

### Verify Database Updates

After each test, check your database:

```sql
-- Check subscription record
SELECT * FROM subscriptions
WHERE stripeSubscriptionId = 'sub_xxx';

-- Check member tier update
SELECT id, email, membershipTier, membershipStatus
FROM members
WHERE stripeCustomerId = 'cus_xxx';

-- Check activity log
SELECT * FROM user_activities
WHERE userId = 'user_xxx'
ORDER BY createdAt DESC
LIMIT 5;
```

---

## Production Deployment

### Switch to Live Mode

1. **Get Live API Keys**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy **Live** publishable and secret keys
   - Update `.env.production` with live keys

2. **Create Live Products**:
   - Switch to "Live mode" in Stripe Dashboard
   - Create products exactly as in test mode
   - Update price IDs in `.env.production`

3. **Set Up Live Webhook**:
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select same events as test mode
   - Update `STRIPE_WEBHOOK_SECRET` with live signing secret

4. **Enable Live Customer Portal**:
   - Switch to Live mode
   - Go to Settings → Billing → Customer portal
   - Activate and configure

5. **Update Environment Variables**:
   ```env
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   STRIPE_PRICE_MONTHLY=price_your_live_monthly_price_id
   STRIPE_PRICE_YEARLY=price_your_live_yearly_price_id
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

### Pre-Launch Checklist

- [ ] All environment variables set in production
- [ ] Products created in Live mode
- [ ] Webhook endpoint configured and verified
- [ ] Customer portal enabled and configured
- [ ] Test subscription flow end-to-end
- [ ] Verify email receipts are sent
- [ ] Test cancellation flow
- [ ] Check webhook logs for errors
- [ ] Verify database updates correctly
- [ ] Test trial-to-paid conversion

---

## Troubleshooting

### Webhook Not Receiving Events

**Problem**: Stripe events not triggering webhook handler

**Solutions**:
1. Check webhook endpoint is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check webhook logs in Stripe Dashboard
4. Ensure endpoint URL is exact: `/api/stripe/webhook`
5. Check server logs for errors

### Payment Failing Silently

**Problem**: Checkout completes but subscription not created

**Solutions**:
1. Check webhook is configured correctly
2. Verify `checkout.session.completed` event is enabled
3. Check server logs for database errors
4. Ensure member record exists before checkout
5. Verify Stripe customer ID is saved correctly

### Customer Portal Not Loading

**Problem**: "Manage Billing" button doesn't work

**Solutions**:
1. Verify user has `stripeCustomerId` in database
2. Check Customer Portal is enabled in Stripe
3. Verify API call succeeds in browser console
4. Check `STRIPE_SECRET_KEY` is correct
5. Ensure user has at least one subscription

### Subscription Not Updating After Payment

**Problem**: Member tier not changing after successful payment

**Solutions**:
1. Check `customer.subscription.updated` webhook fired
2. Verify webhook handler updates member tier
3. Check database for subscription record
4. Look for errors in webhook logs
5. Manually trigger webhook event for testing

### Trial Period Not Converting

**Problem**: Trial users not upgrading correctly

**Solutions**:
1. Verify trial days calculated correctly
2. Check `trialPeriodDays` passed to Stripe
3. Ensure trial end date cleared after conversion
4. Verify subscription status changes to ACTIVE
5. Check member tier updates from Free to SUCCESSPlus

---

## Support

For Stripe-specific issues:
- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com

For application issues:
- Check server logs: `npm run dev` output
- Check webhook logs: Stripe CLI `stripe listen`
- Check database: Verify records in `subscriptions` and `members` tables
- Check browser console: Look for API errors

---

## API Endpoints Reference

### POST `/api/stripe/create-checkout-session`
Create a new Stripe Checkout session

**Body**:
```json
{
  "plan": "monthly" | "yearly"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/xxx"
}
```

### POST `/api/stripe/create-portal-session`
Create a Stripe Customer Portal session

**Response**:
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

### POST `/api/stripe/webhook`
Handle Stripe webhook events

**Headers**:
- `stripe-signature`: Webhook signature for verification

**Events Handled**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use test mode** for all development and testing
3. **Verify webhook signatures** to prevent tampering
4. **Use HTTPS** in production for all Stripe communication
5. **Rotate keys** if compromised
6. **Monitor webhook logs** for suspicious activity
7. **Validate all user input** before sending to Stripe
8. **Use raw request body** for webhook verification
9. **Set proper CORS** headers for API endpoints
10. **Log all Stripe errors** for debugging

---

## Questions?

If you encounter any issues not covered in this guide, please:
1. Check Stripe Dashboard logs
2. Review server console output
3. Check webhook delivery logs
4. Test with Stripe CLI
5. Contact support with specific error messages
