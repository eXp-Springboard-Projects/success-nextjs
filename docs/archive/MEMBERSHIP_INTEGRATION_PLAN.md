# SUCCESS+ Membership Integration Plan

## Current Implementation Status

### ✅ Completed Components

1. **Checkout Page** - `/pages/offer/success-plus.tsx`
   - Two membership tiers: Collective & Insider
   - Monthly and Annual billing options
   - Price matching production ($24.99/mo, $209/yr for Collective; $64.99/mo, $545/yr for Insider)
   - Feature comparison
   - 30-day money-back guarantee messaging
   - FAQ section

2. **Stripe Integration** - `/pages/api/stripe/create-checkout.ts`
   - Stripe Checkout session creation
   - Subscription mode with recurring billing
   - Metadata tracking (tier, billing cycle, user ID)
   - Promotion code support

3. **Session Verification** - `/pages/api/stripe/verify-session.ts`
   - Payment confirmation
   - Activity logging to database

4. **Welcome Page** - `/pages/success-plus/welcome.tsx`
   - Post-purchase thank you page

### 🚧 Required Development

## 1. Stripe Webhook Handler for SUCCESS+ Platform Provisioning

**File to Create:** `/pages/api/stripe/webhooks.ts`

**Purpose:** Listen to Stripe events and provision SUCCESS+ access

**Events to Handle:**
- `checkout.session.completed` - Initial payment successful
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Tier upgrade/downgrade
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Recurring payment
- `invoice.payment_failed` - Failed payment

**Actions:**
1. Create/update user in SUCCESS+ platform database
2. Grant appropriate tier permissions
3. Send welcome email with login credentials
4. Log subscription event

## 2. C+W Magazine Webhook Integration

**File to Create:** `/pages/api/webhooks/magazine-fulfillment.ts`

**Purpose:** Send magazine subscription data to C+W for Insider tier members

**Required for:**
- Insider tier annual subscribers (get print magazine)
- Insider tier monthly subscribers (get print magazine)

**Webhook Payload to C+W:**
```json
{
  "event": "subscription.created",
  "timestamp": "2025-11-02T10:00:00Z",
  "subscription_id": "sub_xxx",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "shipping_address": {
      "line1": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postal_code": "78701",
      "country": "US"
    }
  },
  "tier": "insider",
  "billing_cycle": "annual",
  "start_date": "2025-11-02",
  "status": "active"
}
```

**Required Environment Variables:**
- `CW_WEBHOOK_URL` - C+W fulfillment webhook endpoint
- `CW_WEBHOOK_SECRET` - Authentication token for C+W API

## 3. Database Schema Updates

**Required Tables:** (Check if already in Prisma schema)

```prisma
model Subscription {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  stripeCustomerId  String   @unique
  stripeSubscriptionId String @unique
  tier              String   // 'collective' or 'insider'
  billingCycle      String   // 'monthly' or 'annual'
  status            String   // 'active', 'canceled', 'past_due'
  currentPeriodStart DateTime
  currentPeriodEnd  DateTime
  cancelAtPeriodEnd Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model MagazineSubscription {
  id              String   @id @default(uuid())
  subscriptionId  String   @unique
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  cwSubscriptionId String? // C+W's subscription ID
  shippingAddress Json
  status          String   // 'active', 'canceled', 'pending'
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 4. Checkout Flow Diagram

```
User visits /offer/success-plus
        ↓
User selects tier & billing cycle
        ↓
User clicks "Join [Tier]" button
        ↓
API call to /api/stripe/create-checkout
        ↓
Redirects to Stripe Checkout (hosted)
        ↓
User enters payment info on Stripe
        ↓
        ├─ Success → Redirects to /success-plus/welcome
        │              ↓
        │         Stripe webhook fires:
        │              ↓
        │         1. Create subscription in database
        │         2. Grant SUCCESS+ platform access
        │         3. If Insider: Send to C+W webhook
        │         4. Send welcome email
        │         5. Log analytics event
        │
        └─ Cancel → Redirects back to /offer/success-plus
```

## 5. Integration Checklist

### Stripe Configuration
- [ ] Create Stripe Products for all 4 variants:
  - [ ] Collective Monthly ($24.99/month)
  - [ ] Collective Annual ($209/year)
  - [ ] Insider Monthly ($64.99/month)
  - [ ] Insider Annual ($545/year)
- [ ] Update `PRICING` object in `create-checkout.ts` with real Stripe Price IDs
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard
- [ ] Set webhook signing secret in environment variables

### Database Setup
- [ ] Run Prisma migration to add Subscription and MagazineSubscription tables
- [ ] Set up database indexes for performance

### C+W Integration
- [ ] Get C+W webhook URL and authentication credentials
- [ ] Test C+W webhook with sample payload
- [ ] Set up error handling and retry logic for failed C+W requests
- [ ] Create admin interface to manually resend failed fulfillment requests

### Email Setup
- [ ] Create welcome email template for Collective tier
- [ ] Create welcome email template for Insider tier
- [ ] Configure email sending service (SendGrid, Resend, etc.)

### Testing
- [ ] Test Stripe Checkout flow with test credit cards
- [ ] Test webhook handling for all events
- [ ] Test C+W integration with staging environment
- [ ] Test subscription cancellation flow
- [ ] Test tier upgrade/downgrade

### Monitoring
- [ ] Set up Sentry error tracking for webhooks
- [ ] Create dashboard to monitor subscription metrics
- [ ] Set up alerts for failed webhooks
- [ ] Log all subscription events for audit trail

## 6. Payment Flow: Stripe vs WooCommerce

**Current Implementation:** Stripe Checkout (Recommended)

**Advantages:**
- Modern hosted checkout UI
- PCI compliance handled by Stripe
- Better fraud detection
- Simpler integration
- Automatic subscription management
- Better mobile experience

**WooCommerce Alternative:** (If required)
- Would need to run WordPress separately or use WooCommerce API
- More complex setup
- Requires managing WordPress installation
- Less flexible for custom subscription logic

**Recommendation:** Continue with Stripe unless there's a specific business requirement for WooCommerce.

## 7. SUCCESS+ Platform Access

**Post-Purchase User Experience:**

1. **New Users:**
   - Create account in database
   - Send welcome email with temporary password
   - Redirect to /success-plus/welcome with setup instructions

2. **Existing Users:**
   - Update subscription status
   - Grant appropriate tier permissions
   - Send upgrade confirmation email

3. **Access Control:**
   - Check subscription status in middleware
   - Restrict content based on tier:
     - Collective: Digital content only
     - Insider: All content + print magazine

## 8. Next Steps (Priority Order)

1. **High Priority:**
   - Create Stripe webhook handler (`/pages/api/stripe/webhooks.ts`)
   - Update Prisma schema with Subscription tables
   - Run database migration
   - Create Stripe Products and get Price IDs
   - Update create-checkout.ts with real Price IDs

2. **Medium Priority:**
   - Create C+W webhook integration
   - Set up email templates
   - Create admin dashboard for subscription management

3. **Low Priority:**
   - Add analytics tracking for conversion funnel
   - Create customer portal for self-service subscription management
   - Add upsell prompts for tier upgrades

## 9. Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# C+W Magazine Fulfillment
CW_WEBHOOK_URL=https://fulfillment.candw.com/webhooks/success
CW_WEBHOOK_SECRET=xxx
CW_API_KEY=xxx

# Email
SENDGRID_API_KEY=xxx
EMAIL_FROM=membersupport@success.com

# Database
DATABASE_URL=postgres://xxx

# App URLs
NEXT_PUBLIC_APP_URL=https://success-nextjs.vercel.app
```

## 10. Questions for Product Team

1. **C+W Integration:**
   - What is the exact webhook URL for C+W fulfillment?
   - What authentication method does C+W require?
   - Do we have a staging environment for testing?
   - What happens if a user changes their shipping address?

2. **SUCCESS+ Platform:**
   - Is there an existing user database we need to sync with?
   - What's the authentication mechanism (email/password, SSO, magic link)?
   - Do we need to provision accounts in another system?

3. **Business Rules:**
   - Can users upgrade from Collective to Insider mid-cycle?
   - What happens to magazine subscription if user downgrades from Insider to Collective?
   - Do we prorate when users switch billing cycles?
   - What's the cancellation policy? (Immediate vs. end of period)

4. **Content Access:**
   - Which courses/content are Collective-only vs Insider-only?
   - Is there a WordPress site that needs to check subscription status?
   - Do we need SSO between success.com and success-nextjs?

## 11. Timeline Estimate

- **Stripe Webhook + Database (2-3 days)**
  - Create webhook handler
  - Update Prisma schema
  - Test subscription flows

- **C+W Integration (1-2 days)**
  - Depends on C+W API documentation
  - Testing and error handling

- **Email Templates (1 day)**
  - Design and implement templates

- **Testing & QA (2-3 days)**
  - End-to-end testing
  - Edge case handling

**Total: 6-9 days of development work**
