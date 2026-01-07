# HubSpot Integrations Migration Guide

This document outlines the HubSpot integrations used and their replacements in the SUCCESS CRM.

## Integration Overview

| Integration | Purpose | Migration Path | Status |
|-------------|---------|----------------|--------|
| **Zapier** | Trigger webhooks/actions from CRM data | Native webhooks + n8n/Make.com | ✅ Ready |
| **Sinch** | SMS sending | Direct Sinch API integration | ✅ Ready |
| **WooCommerce** | E-commerce orders → CRM deals | Direct WooCommerce webhook integration | ✅ Ready |

---

## 1. Zapier → Native Webhooks + Automation

### What It Did in HubSpot
- Triggered webhooks when contacts were created/updated
- Automated actions based on CRM data changes
- Connected HubSpot to third-party services

### Replacement Strategy
**Option A: Native Webhooks (Recommended)**
- Use Supabase Database Webhooks
- Trigger on INSERT/UPDATE/DELETE operations
- Send to any HTTP endpoint

**Option B: n8n or Make.com**
- Open-source workflow automation (n8n)
- Visual workflow builder
- More powerful than Zapier
- Self-hosted option available

### Implementation

#### Native Supabase Webhooks
```sql
-- Create webhook for new contacts
CREATE OR REPLACE FUNCTION notify_new_contact()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_contact',
    json_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'firstName', NEW."firstName",
      'lastName', NEW."lastName",
      'lifecycleStage', NEW."lifecycleStage"
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_created_webhook
AFTER INSERT ON contacts
FOR EACH ROW
EXECUTE FUNCTION notify_new_contact();
```

#### API Endpoint for External Webhooks
```typescript
// pages/api/webhooks/contact-created.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { contactId } = req.body;

  // Fetch contact data
  const { data: contact } = await supabaseAdmin()
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  // Send to external services (examples)
  const webhookTargets = [
    'https://your-service.com/webhook',
    'https://analytics-platform.com/track',
    'https://email-service.com/subscribe'
  ];

  await Promise.all(
    webhookTargets.map(url =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      })
    )
  );

  return res.status(200).json({ success: true });
}
```

### Common Zapier Workflows to Migrate

1. **Contact Created → Send to Analytics**
   - Replace with: Supabase webhook → Analytics API

2. **Deal Won → Notify Team**
   - Replace with: CRM automation workflow

3. **Form Submitted → Create Contact**
   - Replace with: Direct form submission API

---

## 2. Sinch SMS Integration

### What It Did in HubSpot
- Sent SMS messages from contact/deal records
- Triggered SMS sequences
- Tracked SMS delivery and responses

### Replacement: Direct Sinch API

#### Environment Variables
```env
SINCH_SERVICE_PLAN_ID=your_service_plan_id
SINCH_API_TOKEN=your_api_token
SINCH_FROM_NUMBER=+1234567890
```

#### SMS Service Implementation
```typescript
// lib/sms/sinch.ts
interface SendSMSParams {
  to: string;
  message: string;
  contactId?: string;
}

export async function sendSMS({ to, message, contactId }: SendSMSParams) {
  const servicePlanId = process.env.SINCH_SERVICE_PLAN_ID;
  const apiToken = process.env.SINCH_API_TOKEN;
  const from = process.env.SINCH_FROM_NUMBER;

  const response = await fetch(
    `https://us.sms.api.sinch.com/xms/v1/${servicePlanId}/batches`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        body: message,
      }),
    }
  );

  const result = await response.json();

  // Track in CRM
  if (contactId) {
    const supabase = supabaseAdmin();
    await supabase.from('contacts').update({
      lastSentSmsDate: new Date().toISOString(),
      totalSentSms: supabase.raw('COALESCE("totalSentSms", 0) + 1'),
    }).eq('id', contactId);

    // Log SMS activity
    await supabase.from('sms_logs').insert({
      contactId,
      direction: 'outbound',
      phoneNumber: to,
      message,
      status: result.id ? 'sent' : 'failed',
      sinchBatchId: result.id,
      createdAt: new Date().toISOString(),
    });
  }

  return result;
}
```

#### SMS API Endpoint
```typescript
// pages/api/sms/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { sendSMS } from '@/lib/sms/sinch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !['STAFF', 'ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { to, message, contactId } = req.body;

  try {
    const result = await sendSMS({ to, message, contactId });
    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('SMS send error:', error);
    return res.status(500).json({ message: error.message });
  }
}
```

#### SMS Sequence Automation
```typescript
// Example: Daily quote SMS sequence
export async function sendDailyQuoteSMS() {
  const supabase = supabaseAdmin();

  // Get opted-in subscribers
  const { data: subscribers } = await supabase
    .from('contacts')
    .select('id, phone, firstName')
    .eq('smsQuotesOptIn', true)
    .eq('smsOptInOut', 'opt-in')
    .not('phone', 'is', null);

  const quote = await getDailyQuote(); // Your quote fetching logic

  for (const subscriber of subscribers || []) {
    const message = `Good morning ${subscriber.firstName}! Today's quote: "${quote.text}" - ${quote.author}`;

    await sendSMS({
      to: subscriber.phone,
      message,
      contactId: subscriber.id,
    });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

---

## 3. WooCommerce Integration

### What It Did in HubSpot
- Synced WooCommerce orders as HubSpot deals
- Created/updated contacts from customer data
- Tracked product purchases and revenue

### Replacement: Direct WooCommerce Webhooks

#### WooCommerce Webhook Setup

**In WooCommerce Admin:**
1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Create webhook for "Order created"
3. Delivery URL: `https://www.success.com/api/webhooks/woocommerce/order-created`
4. Secret: Generate strong secret, add to `.env`
5. API Version: WP REST API Integration v3

#### Webhook Handler
```typescript
// pages/api/webhooks/woocommerce/order-created.ts
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

function verifyWebhookSignature(req: NextApiRequest): boolean {
  const signature = req.headers['x-wc-webhook-signature'] as string;
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || '';
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');

  return signature === expectedSignature;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const order = req.body;
  const supabase = supabaseAdmin();

  try {
    // 1. Create or update contact
    const { data: contact } = await supabase
      .from('contacts')
      .upsert({
        email: order.billing.email,
        firstName: order.billing.first_name,
        lastName: order.billing.last_name,
        phone: order.billing.phone,
        billingAddressLine1: order.billing.address_1,
        billingAddressLine2: order.billing.address_2,
        billingCity: order.billing.city,
        billingState: order.billing.state,
        billingPostalCode: order.billing.postcode,
        billingCountry: order.billing.country,
        shippingAddressLine1: order.shipping.address_1,
        shippingAddressLine2: order.shipping.address_2,
        shippingCity: order.shipping.city,
        shippingState: order.shipping.state,
        shippingPostalCode: order.shipping.postcode,
        shippingCountry: order.shipping.country,
        lastOrderDate: new Date(order.date_created).toISOString(),
        lastOrderValue: parseFloat(order.total),
      }, { onConflict: 'email' })
      .select()
      .single();

    // 2. Create deal from order
    const { data: deal } = await supabase.from('deals').insert({
      dealName: `Order #${order.number}`,
      pipeline: 'woocommerce',
      dealStage: order.status, // pending_payment, processing, completed, etc
      amount: parseFloat(order.total),
      orderId: order.id.toString(),
      orderNumber: order.number,
      orderStatus: order.status,
      orderDate: new Date(order.date_created).toISOString(),
      customerId: contact?.id,
      grossValueOfOrder: parseFloat(order.total),
      netValueOfOrder: parseFloat(order.total) - parseFloat(order.total_tax || 0),
      discounts: parseFloat(order.discount_total || 0),
      shipping: parseFloat(order.shipping_total || 0),
      tax: parseFloat(order.total_tax || 0),
      paymentTitle: order.payment_method_title,
      ecommerceDeal: true,
      // Billing address
      billingAddressLine1: order.billing.address_1,
      billingCity: order.billing.city,
      billingState: order.billing.state,
      billingPostalCode: order.billing.postcode,
      billingCountry: order.billing.country,
      billingPhone: order.billing.phone,
      // Shipping address
      shippingAddressLine1: order.shipping.address_1,
      shippingCity: order.shipping.city,
      shippingState: order.shipping.state,
      shippingPostalCode: order.shipping.postcode,
      shippingCountry: order.shipping.country,
      // Products
      lastProductsBought: order.line_items.map((item: any) => item.name).join(', '),
      lastSKUsBought: order.line_items.map((item: any) => item.sku).join(', '),
      lastTotalNumberOfProductsBought: order.line_items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    }).select().single();

    // 3. Create line items
    for (const item of order.line_items) {
      await supabase.from('deal_line_items').insert({
        dealId: deal?.id,
        productName: item.name,
        productSKU: item.sku,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
      });
    }

    return res.status(200).json({ success: true, dealId: deal?.id });
  } catch (error: any) {
    console.error('WooCommerce webhook error:', error);
    return res.status(500).json({ message: error.message });
  }
}
```

#### Order Status Update Webhook
```typescript
// pages/api/webhooks/woocommerce/order-updated.ts
// Similar structure, updates existing deal based on order.id
// Handles: processing, completed, cancelled, refunded, failed statuses
```

---

## Migration Checklist

### Pre-Migration
- [ ] Export all Zapier workflows documentation
- [ ] Document all webhook endpoints currently in use
- [ ] List all SMS sequences and templates
- [ ] Export WooCommerce integration settings

### Zapier Replacement
- [ ] Set up Supabase database webhooks
- [ ] Create API endpoints for webhook receivers
- [ ] Set up n8n or Make.com (if needed)
- [ ] Test all webhook triggers
- [ ] Migrate Zap logic to CRM automation workflows

### Sinch SMS
- [ ] Get Sinch API credentials
- [ ] Add environment variables
- [ ] Create SMS sending API endpoint
- [ ] Migrate SMS templates
- [ ] Set up SMS sequences
- [ ] Test delivery and tracking
- [ ] Migrate opt-in/opt-out lists

### WooCommerce
- [ ] Create webhook endpoints
- [ ] Generate webhook secret
- [ ] Configure WooCommerce webhooks:
  - [ ] Order created
  - [ ] Order updated
  - [ ] Order deleted (optional)
- [ ] Test order sync
- [ ] Verify contact creation
- [ ] Test product tracking
- [ ] Validate revenue calculations

### Post-Migration
- [ ] Monitor webhook delivery rates
- [ ] Set up error logging and alerts
- [ ] Create backup/retry mechanisms
- [ ] Document new integration architecture
- [ ] Train team on new workflows

---

## Additional Resources

### Webhook Security Best Practices
1. Always validate webhook signatures
2. Use HTTPS only
3. Implement rate limiting
4. Log all webhook events
5. Set up retry logic for failures

### Monitoring & Debugging
```typescript
// Create webhook logs table
CREATE TABLE webhook_logs (
  id TEXT PRIMARY KEY DEFAULT ('log_' || gen_random_uuid()::text),
  source TEXT NOT NULL, -- 'woocommerce', 'sinch', 'zapier_replacement'
  event TEXT NOT NULL,
  payload JSONB,
  status TEXT, -- 'success', 'failed', 'retry'
  error TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs("createdAt");
```

### Error Handling & Retries
```typescript
async function processWebhookWithRetry(
  processor: () => Promise<any>,
  maxRetries = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await processor();
    } catch (error) {
      lastError = error;
      console.error(`Webhook processing attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
```
