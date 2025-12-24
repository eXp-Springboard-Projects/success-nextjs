import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';
import crypto from 'crypto';

/**
 * Resend Webhook Handler
 * Handles: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 *
 * Setup in Resend:
 * 1. Go to Webhooks in Resend dashboard
 * 2. Add webhook: https://yourdomain.com/api/webhooks/resend/route
 * 3. Select events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 * 4. Copy webhook secret and add to .env.local as RESEND_WEBHOOK_SECRET
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature (if secret is set)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['svix-signature'] as string;
      const timestamp = req.headers['svix-timestamp'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature || !timestamp) {
        return res.status(401).json({ error: 'Missing signature headers' });
      }

      // Verify signature
      const signedContent = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedContent)
        .digest('base64');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event.type;

    if (!eventType) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    const data = event.data;
    const emailAddress = data.to?.[0] || data.email;

    if (!emailAddress) {
      return res.status(200).json({ received: true });
    }

    // Find contact by email
    const { data: contact, error: contactError } = await supabaseAdmin()
      .from('contacts')
      .select('*')
      .eq('email', emailAddress)
      .single();

    if (!contact || contactError) {
      return res.status(200).json({ received: true });
    }

    // Extract campaign ID from tags or metadata
    const campaignId = data.tags?.campaignId || data.metadata?.campaignId;

    if (!campaignId) {
      return res.status(200).json({ received: true });
    }

    // Map Resend event types to our event types
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'open',
      'email.clicked': 'click',
      'email.bounced': 'bounce',
      'email.complained': 'spam_report',
    };

    const mappedEventType = eventTypeMap[eventType] || eventType;

    // Create email event
    const { error: eventError } = await supabaseAdmin()
      .from('email_events')
      .insert({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        contactId: contact.id,
        emailAddress,
        event: mappedEventType,
        eventData: data,
      });

    if (eventError) throw eventError;

    // Update campaign stats
    const { data: campaign, error: campaignError } = await supabaseAdmin()
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaign && !campaignError) {
      const updateData: any = {};

      if (mappedEventType === 'delivered') {
        updateData.deliveredCount = (campaign.deliveredCount || 0) + 1;
      } else if (mappedEventType === 'open') {
        updateData.openedCount = (campaign.openedCount || 0) + 1;
      } else if (mappedEventType === 'click') {
        updateData.clickedCount = (campaign.clickedCount || 0) + 1;
      } else if (mappedEventType === 'bounce') {
        updateData.bouncedCount = (campaign.bouncedCount || 0) + 1;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin()
          .from('campaigns')
          .update(updateData)
          .eq('id', campaignId);

        if (updateError) throw updateError;
      }
    }

    // Update contact engagement score
    let scoreChange = 0;
    if (mappedEventType === 'open') scoreChange = 10;
    else if (mappedEventType === 'click') scoreChange = 20;
    else if (mappedEventType === 'bounce') scoreChange = -50;
    else if (mappedEventType === 'spam_report') scoreChange = -100;

    if (scoreChange !== 0) {
      const { error: scoreError } = await supabaseAdmin()
        .from('contacts')
        .update({
          emailEngagementScore: (contact.emailEngagementScore || 0) + scoreChange,
        })
        .eq('id', contact.id);

      if (scoreError) throw scoreError;
    }

    // Mark contact as unsubscribed if complained
    if (mappedEventType === 'spam_report') {
      const { error: unsubError } = await supabaseAdmin()
        .from('contacts')
        .update({ status: 'UNSUBSCRIBED' })
        .eq('id', contact.id);

      if (unsubError) throw unsubError;
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
