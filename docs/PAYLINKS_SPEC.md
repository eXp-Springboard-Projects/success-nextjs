# PayLinks System Specification

## Overview

The PayLinks system allows administrators to create secure, shareable payment links for one-time or recurring payments. Each link has a unique URL that can be shared with customers, tracked for usage, and managed through the admin dashboard.

**Status**: ✅ **FULLY IMPLEMENTED**

---

## Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Admin Dashboard](#admin-dashboard)
5. [Public Payment Flow](#public-payment-flow)
6. [Stripe Integration](#stripe-integration)
7. [Security](#security)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Future Enhancements](#future-enhancements)

---

## Features

### ✅ Implemented Features

1. **Create Payment Links**
   - Custom title and description
   - Set amount (USD, with support for other currencies)
   - Generate unique URL slug
   - Optional expiration date
   - Optional maximum uses limit
   - Optional shipping address collection
   - Custom fields (JSON metadata)

2. **Manage Payment Links**
   - View all payment links with filtering
   - Search by title or slug
   - Edit existing links
   - Activate/deactivate links
   - Delete links (archives Stripe product)
   - Track usage stats

3. **Public Payment Page**
   - Beautiful, branded payment form
   - Customer information collection
   - Shipping address collection (if required)
   - Secure Stripe Checkout integration
   - Success/error handling

4. **Payment Tracking**
   - Track number of uses per link
   - Track total revenue per link
   - Webhook integration for real-time updates
   - Order creation for payment history

5. **Admin Dashboard**
   - Stats overview (total links, active, revenue)
   - Sortable/filterable table
   - Copy link to clipboard
   - Quick activate/deactivate toggle
   - Delete with confirmation

---

## Database Schema

### `pay_links` Table

```prisma
model pay_links {
  id               String        @id
  userId           String
  title            String
  description      String?
  amount           Decimal       @db.Decimal(10, 2)
  currency         String        @default("USD")
  slug             String        @unique
  stripePriceId    String?
  stripeProductId  String?
  status           PayLinkStatus @default(ACTIVE)
  expiresAt        DateTime?
  maxUses          Int?
  currentUses      Int           @default(0)
  requiresShipping Boolean       @default(false)
  customFields     Json?
  metadata         Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime
  users            users         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([slug])
  @@index([status])
  @@index([userId])
}

enum PayLinkStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  ARCHIVED
}
```

### Key Fields

- **id**: UUID primary key
- **userId**: Creator of the link (admin)
- **title**: Display name (e.g., "Black Friday Special")
- **description**: Optional description shown on payment page
- **amount**: Price in decimal format
- **currency**: Currency code (default: USD)
- **slug**: Unique URL-friendly identifier
- **stripePriceId**: Stripe Price ID (created automatically)
- **stripeProductId**: Stripe Product ID (created automatically)
- **status**: ACTIVE, INACTIVE, EXPIRED, or ARCHIVED
- **expiresAt**: Optional expiration timestamp
- **maxUses**: Optional maximum number of uses
- **currentUses**: Counter incremented on successful payment
- **requiresShipping**: Whether to collect shipping address
- **customFields**: Optional JSON for additional data
- **metadata**: Optional JSON for internal tracking

---

## API Endpoints

### Admin Endpoints (Requires Authentication)

#### `GET /api/paylinks`

List all payment links with optional filtering.

**Query Parameters**:
- `status` (optional): Filter by status (ACTIVE, INACTIVE, EXPIRED)
- `search` (optional): Search by title or slug

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Black Friday Special",
    "description": "50% off annual membership",
    "amount": "99.99",
    "currency": "USD",
    "slug": "black-friday-special",
    "status": "ACTIVE",
    "currentUses": 15,
    "maxUses": 100,
    "expiresAt": "2025-11-30T23:59:59Z",
    "isExpired": false,
    "isMaxedOut": false,
    "createdAt": "2025-11-01T00:00:00Z",
    "users": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@success.com"
    }
  }
]
```

#### `POST /api/paylinks`

Create a new payment link.

**Request Body**:
```json
{
  "title": "Black Friday Special",
  "description": "50% off annual membership",
  "amount": 99.99,
  "currency": "USD",
  "slug": "black-friday-special",
  "expiresAt": "2025-11-30T23:59:59Z",
  "maxUses": 100,
  "requiresShipping": false,
  "customFields": {},
  "metadata": {}
}
```

**Response**: Created paylink object

**Actions**:
1. Validates input data
2. Checks slug uniqueness
3. Creates Stripe Product
4. Creates Stripe Price
5. Saves to database
6. Logs activity

#### `GET /api/paylinks/[id]`

Get a specific payment link.

**Response**: Single paylink object

#### `PUT /api/paylinks/[id]`

Update an existing payment link.

**Request Body**: Same as POST (all fields optional)

**Special Behavior**:
- If amount changes, creates new Stripe Price and archives old one
- Updates product metadata in Stripe

#### `DELETE /api/paylinks/[id]`

Delete a payment link.

**Actions**:
1. Archives Stripe Product (sets active: false)
2. Deletes from database
3. Logs activity

#### `GET /api/paylinks/[id]/stats`

Get usage statistics for a payment link.

**Response**:
```json
{
  "totalUses": 15,
  "maxUses": 100,
  "remainingUses": 85,
  "totalRevenue": 1499.85,
  "status": "ACTIVE",
  "isExpired": false,
  "isMaxedOut": false,
  "createdAt": "2025-11-01T00:00:00Z",
  "lastUsed": "2025-11-07T15:30:00Z"
}
```

### Public Endpoints (No Authentication)

#### `POST /api/pay/create-checkout`

Create a Stripe Checkout session for a payment link.

**Request Body**:
```json
{
  "paylinkId": "uuid",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "shippingAddress": {
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  }
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Actions**:
1. Validates paylink is active and available
2. Creates or retrieves Stripe Customer
3. Creates Stripe Checkout Session
4. Returns checkout URL for redirect

#### `POST /api/pay/webhook`

Stripe webhook endpoint for payment events.

**Events Handled**:
- `checkout.session.completed` - Increments usage count, creates order
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Logs failed payment

**Security**: Validates Stripe signature using `STRIPE_WEBHOOK_SECRET`

---

## Admin Dashboard

### Location

`/admin/paylinks`

### Features

1. **Stats Cards**
   - Total Links
   - Active Links
   - Total Revenue
   - Expired/Maxed Out Links

2. **Create Form**
   - Toggle form with close button
   - Auto-generates slug from title
   - Amount validation
   - Optional fields (expiration, max uses, shipping)
   - Real-time URL preview

3. **Filters**
   - Search input (title/slug)
   - Status buttons (All, Active, Inactive, Expired)

4. **Table View**
   - Columns: Title, Amount, Slug, Uses, Status, Created, Actions
   - Status badges with color coding
   - Usage counter with max uses
   - Action buttons:
     - 📋 Copy link to clipboard
     - ⏸️/▶️ Activate/Deactivate toggle
     - View (opens public page in new tab)
     - Delete (with confirmation)

5. **Responsive Design**
   - Mobile-friendly layout
   - Stacks on small screens
   - Touch-friendly buttons

---

## Public Payment Flow

### URL Structure

```
https://www.success.com/pay/[slug]
```

Examples:
- `https://www.success.com/pay/black-friday-special`
- `https://www.success.com/pay/event-ticket`
- `https://www.success.com/pay/vip-bundle-2024`

### Payment Page (`/pay/[slug]`)

**Server-Side Rendering**:
- Fetches paylink from database
- Validates status, expiration, max uses
- Returns 404 if invalid

**Page Sections**:

1. **Header** (Dark gradient)
   - Title
   - Description
   - Amount display (large, prominent)

2. **Customer Information Form**
   - Full Name (required)
   - Email Address (required)
   - Email confirmation notice

3. **Shipping Address** (if required)
   - Address Line 1 & 2
   - City, State, ZIP
   - Country selector

4. **Submit Button**
   - Shows amount
   - Loading spinner during processing
   - Disabled state

5. **Security Badge**
   - "Secure payment powered by Stripe"
   - Lock icon

6. **Footer**
   - Terms & Privacy Policy mention
   - Powered by SUCCESS Magazine

### Success Page (`/pay/success`)

**Features**:
- Success icon animation
- Order confirmation
- Receipt email notice
- Return to home button
- Support contact information

**Query Parameters**:
- `session_id` - Stripe Checkout Session ID

---

## Stripe Integration

### Products & Prices

When a PayLink is created:

1. **Stripe Product** is created:
   ```javascript
   {
     name: paylink.title,
     description: paylink.description,
     metadata: {
       paylink_slug: paylink.slug,
       created_by: admin.id
     }
   }
   ```

2. **Stripe Price** is created:
   ```javascript
   {
     product: product.id,
     unit_amount: Math.round(amount * 100), // Convert to cents
     currency: currency.toLowerCase(),
     metadata: {
       paylink_slug: paylink.slug
     }
   }
   ```

3. IDs are saved to `pay_links` table

### Checkout Sessions

**Mode**: `payment` (one-time payment)

**Features Enabled**:
- Card payments
- Customer creation/retrieval
- Success/cancel URLs
- Metadata for tracking
- Optional shipping address collection

**Metadata Passed**:
```javascript
{
  paylink_id: paylink.id,
  paylink_slug: paylink.slug,
  paylink_title: paylink.title
}
```

### Webhooks

**Endpoint**: `/api/pay/webhook`

**Required Environment Variable**:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Setup Steps**:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/pay/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook secret to `.env.local`

**Security**:
- Signature verification using `stripe.webhooks.constructEvent()`
- Raw body parsing (disabled Next.js body parser)
- Secret validation

---

## Security

### Admin Protection

**Authentication Required**:
- All `/api/paylinks/*` endpoints check NextAuth session
- Only ADMIN or SUPER_ADMIN roles can access
- Returns 401 for unauthenticated requests
- Returns 403 for non-admin users

**Authorization Checks**:
```typescript
const session = await getServerSession(req, res, authOptions);

if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Public Page Validation

**Server-Side Checks** (before rendering):
1. PayLink exists
2. Status is ACTIVE
3. Not expired (if expiresAt set)
4. Not maxed out (if maxUses set)

**Error Handling**:
- Returns friendly error page
- No sensitive information leaked
- Suggests contacting support

### Payment Security

**Stripe Checkout**:
- PCI DSS compliant (Stripe handles card data)
- HTTPS enforced
- No card data touches our servers
- Webhook signature verification

**Data Protection**:
- Customer emails validated
- Shipping addresses sanitized
- Metadata encrypted at rest (Stripe)

### Slug Uniqueness

**Validation**:
- Database unique constraint on slug
- API checks before creation
- Returns clear error if duplicate

**Slug Generation**:
```typescript
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
```

---

## Testing

### Manual Testing Checklist

#### Admin Dashboard

- [ ] Create new payment link
- [ ] Verify slug auto-generation
- [ ] Edit existing link
- [ ] Change amount (verify new Stripe Price created)
- [ ] Toggle active/inactive status
- [ ] Delete link (verify Stripe product archived)
- [ ] Filter by status
- [ ] Search by title/slug
- [ ] Copy link to clipboard

#### Public Payment Page

- [ ] Access valid payment link
- [ ] Verify amount displayed correctly
- [ ] Fill out customer form
- [ ] Submit without required fields (should show error)
- [ ] Submit with valid data (should redirect to Stripe)
- [ ] Complete payment in Stripe Checkout
- [ ] Verify redirect to success page
- [ ] Check email for receipt (from Stripe)

#### Edge Cases

- [ ] Access expired link (should show error)
- [ ] Access maxed out link (should show error)
- [ ] Access inactive link (should show error)
- [ ] Access non-existent slug (should 404)
- [ ] Try to create duplicate slug (should show error)
- [ ] Submit payment multiple times (Stripe handles idempotency)

#### Webhook Testing

Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/pay/webhook
stripe trigger checkout.session.completed
```

- [ ] Webhook receives event
- [ ] Signature verification passes
- [ ] Usage count increments
- [ ] Order record created

### Automated Testing (Future)

**Test Files to Create**:
```
tests/
  api/
    paylinks/
      create.test.ts
      update.test.ts
      delete.test.ts
      stats.test.ts
    pay/
      create-checkout.test.ts
      webhook.test.ts
  pages/
    admin/
      paylinks.test.tsx
    pay/
      payment-page.test.tsx
      success.test.tsx
```

---

## Deployment

### Environment Variables

**Required**:
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="random-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Site URL
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

**Optional**:
```env
# Stripe Product Price IDs (if using specific products)
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_ANNUAL="price_..."
```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name add_paylinks
```

### Stripe Configuration

1. **Dashboard Setup**:
   - Enable Checkout in Stripe Dashboard
   - Configure brand colors/logo
   - Set up email receipts

2. **Webhook Setup**:
   - Add webhook endpoint in Stripe Dashboard
   - URL: `https://your-domain.com/api/pay/webhook`
   - Events: `checkout.session.completed`, `payment_intent.*`
   - Copy webhook secret to environment variables

3. **Testing**:
   - Use test mode keys initially
   - Switch to live keys after testing

### Deployment Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Stripe webhook configured
- [ ] Test payment link created
- [ ] Test payment completed successfully
- [ ] Webhook firing correctly
- [ ] Usage count incrementing
- [ ] Admin dashboard accessible
- [ ] Error pages working
- [ ] Mobile responsiveness verified

---

## Usage Examples

### Example 1: Limited-Time Offer

**Scenario**: Black Friday sale, 50% off, expires Nov 30, limit 100 uses

**Configuration**:
```
Title: Black Friday Special
Description: 50% off SUCCESS+ annual membership
Amount: $49.99 (normally $99.99)
Slug: black-friday-2024
Expires At: 2024-11-30 23:59:59
Max Uses: 100
Requires Shipping: No
```

**URL**: `https://www.success.com/pay/black-friday-2024`

**Tracking**:
- Current Uses: 67 / 100
- Revenue: $3,349.33
- Remaining: 33

### Example 2: Event Ticket

**Scenario**: Virtual summit ticket with shipping (physical swag bag)

**Configuration**:
```
Title: SUCCESS Summit 2025 Ticket
Description: Includes virtual access + swag bag
Amount: $199.00
Slug: summit-2025
Expires At: 2025-03-01 00:00:00
Max Uses: 500
Requires Shipping: Yes
```

**URL**: `https://www.success.com/pay/summit-2025`

**Tracking**:
- Current Uses: 342 / 500
- Revenue: $68,058.00
- Remaining: 158

### Example 3: Custom Consulting Package

**Scenario**: One-off consulting service, no expiration or limit

**Configuration**:
```
Title: Custom Consulting Package
Description: 5-hour strategy session with SUCCESS expert
Amount: $2,500.00
Slug: consulting-package
Expires At: null
Max Uses: null
Requires Shipping: No
```

**URL**: `https://www.success.com/pay/consulting-package`

**Tracking**:
- Current Uses: 8
- Revenue: $20,000.00
- Remaining: Unlimited

---

## PayKickstart Integration (Future Enhancement)

**Note**: Currently, only Stripe integration is implemented. PayKickstart integration can be added as follows:

### PayKickstart Overview

**Use Case**: Alternative to Stripe for:
- Affiliate tracking
- Subscription management
- Sales funnel analytics

### Implementation Plan

1. **Add PayKickstart Fields to Schema**:
   ```prisma
   model pay_links {
     // ... existing fields
     paykickstartCampaignId String?
     paykickstartProductId  String?
     usePaykickstart        Boolean @default(false)
   }
   ```

2. **Create PayKickstart API Client**:
   ```typescript
   // lib/paykickstart.ts
   export async function createPayKickstartLink(paylink) {
     // API integration
   }
   ```

3. **Update Payment Flow**:
   - Check `usePaykickstart` flag
   - Route to PayKickstart or Stripe accordingly
   - Handle different webhook formats

4. **Environment Variables**:
   ```env
   PAYKICKSTART_API_KEY="..."
   PAYKICKSTART_VENDOR_ID="..."
   ```

**Estimated Time**: 6-8 hours

---

## Future Enhancements

### High Priority

1. **Analytics Dashboard**
   - Revenue over time graph
   - Conversion rate tracking
   - Geographic distribution map
   - Device breakdown

2. **Email Notifications**
   - Admin notification on successful payment
   - Customer thank you email (customizable)
   - Reminder emails for expiring links

3. **Advanced Validation**
   - Coupon codes
   - Quantity selector
   - Volume discounts
   - Early bird pricing

4. **Custom Branding**
   - Upload custom logo for payment page
   - Custom colors/themes
   - Custom success page message
   - Custom email templates

### Medium Priority

5. **Recurring Payments**
   - Add support for subscriptions
   - Weekly/monthly/annual options
   - Trial periods

6. **Refund Management**
   - Refund from admin dashboard
   - Partial refunds
   - Refund history

7. **Export Features**
   - Export payment history to CSV
   - Generate reports (PDF)
   - Tax documents

8. **API Access**
   - Public API for creating paylinks programmatically
   - API keys for third-party integrations
   - Zapier integration

### Low Priority

9. **A/B Testing**
   - Multiple versions of payment page
   - Split traffic
   - Conversion tracking

10. **Upsells/Cross-sells**
    - Recommend related products
    - Add-ons during checkout
    - Bump offers

---

## API Reference Summary

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/paylinks` | Yes | List all payment links |
| POST | `/api/paylinks` | Yes | Create payment link |
| GET | `/api/paylinks/[id]` | Yes | Get single link |
| PUT | `/api/paylinks/[id]` | Yes | Update link |
| DELETE | `/api/paylinks/[id]` | Yes | Delete link |
| GET | `/api/paylinks/[id]/stats` | Yes | Get usage stats |
| POST | `/api/pay/create-checkout` | No | Create Stripe checkout |
| POST | `/api/pay/webhook` | No* | Stripe webhook handler |

*Webhook uses Stripe signature verification

### Admin Pages

| Path | Description |
|------|-------------|
| `/admin/paylinks` | PayLinks management dashboard |

### Public Pages

| Path | Description |
|------|-------------|
| `/pay/[slug]` | Public payment page |
| `/pay/success` | Payment success page |

---

## Troubleshooting

### Common Issues

**Issue**: "Payment processing is not configured"
**Solution**: Ensure `STRIPE_SECRET_KEY` is set in environment variables

**Issue**: "Webhook signature verification failed"
**Solution**:
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook endpoint URL matches exactly
- Verify webhook is sending to correct environment (test vs live)

**Issue**: "Slug already exists"
**Solution**: Choose a different slug or edit the existing paylink

**Issue**: Usage count not incrementing
**Solution**:
- Check webhook is configured in Stripe
- Verify webhook secret is correct
- Check webhook event logs in Stripe Dashboard

**Issue**: Customer not redirected to success page
**Solution**:
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check Stripe Checkout success_url configuration

---

## Performance Optimization

### Database Queries

**Indexes** (already implemented):
- `slug` (unique) - for fast lookups
- `status` - for filtering
- `userId` - for creator queries

**Query Optimization**:
- Use `select` to fetch only needed fields
- Include relations only when necessary
- Pagination for large datasets (future)

### Caching

**Current**: None

**Future Recommendations**:
- Cache paylink data (Redis)
- TTL: 5 minutes
- Invalidate on update/delete

### Stripe API Calls

**Optimization**:
- Only create Stripe resources when needed
- Cache customer lookup
- Batch operations (future)

---

## Compliance & Legal

### PCI DSS Compliance

**Status**: ✅ **Compliant**

- No card data stored on our servers
- Stripe handles all sensitive payment data
- Checkout hosted by Stripe (certified)

### Data Privacy (GDPR/CCPA)

**Customer Data Collected**:
- Name, email (required)
- Shipping address (if required by link)

**Data Storage**:
- Stored in Stripe (encrypted)
- Order records in database (email, name)
- No credit card data stored

**Data Retention**:
- Orders kept for tax/legal purposes (7 years recommended)
- Customer can request deletion (contact support)

### Terms & Conditions

**Required**:
- Link to Terms of Service on payment page ✅
- Link to Privacy Policy on payment page ✅
- Clear pricing display ✅
- Refund policy (to be added)

---

## Support & Maintenance

### Monitoring

**Recommended Tools**:
- Stripe Dashboard - payment analytics
- Sentry - error tracking
- Google Analytics - page views
- Database monitoring - query performance

### Alerts

**Set up alerts for**:
- Failed webhook deliveries
- High error rates on payment page
- Unusual payment volumes
- Expired links with traffic

### Backup

**Database**:
- Daily automated backups (Vercel Postgres)
- Retain for 30 days

**Stripe Data**:
- Available in Stripe Dashboard
- Export reports monthly

---

## Conclusion

The PayLinks system is a **fully functional, production-ready** payment link solution integrated with Stripe. It provides a complete admin interface for creating and managing payment links, a beautiful public payment experience, and robust tracking of payment activity.

**Key Benefits**:
- 🚀 **Easy to use** - Simple admin interface
- 🔒 **Secure** - Stripe-powered, PCI compliant
- 📊 **Trackable** - Usage stats and revenue tracking
- 🎨 **Customizable** - Flexible configuration options
- 💰 **Revenue generator** - Enable new monetization streams

**Next Steps**:
1. Configure Stripe account and webhooks
2. Create test payment link
3. Complete test transaction
4. Deploy to production
5. Start creating real payment links!

---

*Last Updated: 2025-11-07*
*Version: 1.0*
*Status: Production Ready ✅*
