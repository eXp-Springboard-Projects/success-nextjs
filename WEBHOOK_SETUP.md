# Webhook Configuration Guide

## Stripe Webhooks

SUCCESS.com uses **TWO Stripe webhook endpoints** with different purposes:

### 1. Main Webhook Handler (RECOMMENDED)
**Endpoint**: `/api/stripe/webhook`
**File**: `pages/api/stripe/webhook.ts`

**Purpose**: Complete subscription lifecycle management
- Checkout session completion
- Subscription creation/updates/cancellation
- Invoice payments (success/failure)
- Database synchronization with Supabase
- User activity logging

**Features**:
- ✅ Uses centralized Stripe client from `lib/stripe.ts`
- ✅ Full error handling and logging
- ✅ Member tier management
- ✅ Trial period handling
- ✅ Activity tracking

**Configure in Stripe Dashboard**:
```
Webhook URL: https://www.success.com/api/stripe/webhook
Events to send:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

### 2. Magazine Fulfillment Webhook
**Endpoint**: `/api/stripe/webhooks`
**File**: `pages/api/stripe/webhooks.ts`

**Purpose**: Magazine fulfillment and C+W integration (Insider tier only)
- Creates member records
- Sends subscription to C+W for magazine delivery
- Handles tier upgrades/downgrades
- Magazine subscription management

**Features**:
- ✅ C+W fulfillment integration
- ✅ Magazine subscription tracking
- ✅ Shipping address handling
- ✅ Tier-specific logic

**Additional Requirements**:
- `CW_WEBHOOK_URL` environment variable
- `CW_WEBHOOK_SECRET` environment variable

**Configure in Stripe Dashboard** (if using magazine fulfillment):
```
Webhook URL: https://www.success.com/api/stripe/webhooks
Events to send:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

---

## Required Environment Variables

### Production (Vercel)

**Stripe** (✅ Configured):
```bash
STRIPE_SECRET_KEY=sk_live_***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_***
STRIPE_WEBHOOK_SECRET=whsec_***  # ⚠️ MISSING - GET FROM STRIPE DASHBOARD
```

**Resend Email** (✅ Configured):
```bash
RESEND_API_KEY=re_***
RESEND_FROM_EMAIL=noreply@success.com
```

**C+W Magazine Fulfillment** (❌ Not Configured):
```bash
CW_WEBHOOK_URL=https://fulfillment.cw.com/webhooks/success  # Example
CW_WEBHOOK_SECRET=***  # Provided by C+W
```

---

## How to Get Stripe Webhook Secret

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Under **Signing secret**, click **Reveal**
4. Copy the secret (starts with `whsec_`)
5. Add to Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the secret when prompted
   ```
6. Redeploy:
   ```bash
   vercel --prod
   ```

---

## Webhook Testing

### Test Locally

1. Install Stripe CLI:
   ```bash
   stripe login
   ```

2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

### Test in Production

Use Stripe Dashboard → **Webhooks** → **Send test webhook**

---

## Troubleshooting

### Webhook Signature Verification Failed
**Cause**: `STRIPE_WEBHOOK_SECRET` not configured or incorrect

**Fix**:
1. Get correct secret from Stripe Dashboard
2. Update Vercel environment variable
3. Redeploy

### C+W Fulfillment Not Working
**Cause**: Missing C+W environment variables

**Fix**:
1. Contact C+W for webhook URL and secret
2. Add environment variables to Vercel
3. Test with Insider tier subscription

### Duplicate Webhook Processing
**Issue**: Both webhook endpoints receiving same events

**Solution**: Choose ONE endpoint and configure only that in Stripe Dashboard
- **Recommended**: Use `/api/stripe/webhook` (main handler)
- Only use `/api/stripe/webhooks` if you need magazine fulfillment

---

## Webhook Endpoints Summary

| Endpoint | Purpose | Status | Use Case |
|----------|---------|--------|----------|
| `/api/stripe/webhook` | Main subscription handler | ✅ Ready | All subscription management |
| `/api/stripe/webhooks` | Magazine fulfillment | ⚠️ Needs C+W config | Insider tier with print magazine |

**Recommendation**: Use main webhook handler (`/api/stripe/webhook`) unless you specifically need magazine fulfillment.
