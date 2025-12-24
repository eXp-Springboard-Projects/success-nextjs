import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * SendGrid Webhook Handler
 * Handles: delivered, open, click, bounce, spam_report, unsubscribe
 *
 * Setup in SendGrid:
 * 1. Go to Settings → Mail Settings → Event Webhook
 * 2. Set URL: https://yourdomain.com/api/webhooks/sendgrid/route
 * 3. Select events: Delivered, Opened, Clicked, Bounced, Spam Reports, Unsubscribed
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      try {
        // Extract email and event type
        const emailAddress = event.email;
        const eventType = event.event;

        if (!emailAddress || !eventType) {
          continue;
        }

        // Find contact by email
        const { data: contact, error: contactError } = await supabaseAdmin()
          .from('contacts')
          .select('*')
          .eq('email', emailAddress)
          .single();

        if (!contact || contactError) {
          continue;
        }

        // Extract campaign ID from custom args or sg_message_id
        const campaignId = event.campaignId || event['sg_campaign_id'];

        if (!campaignId) {
          continue;
        }

        // Create email event
        await supabaseAdmin()
          .from('email_events')
          .insert({
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId,
            contactId: contact.id,
            emailAddress,
            event: eventType,
            eventData: event,
          });

        // Update campaign stats
        const { data: campaign, error: campaignError } = await supabaseAdmin()
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaign && !campaignError) {
          const updateData: any = {};

          if (eventType === 'delivered') {
            updateData.deliveredCount = (campaign.deliveredCount || 0) + 1;
          } else if (eventType === 'open') {
            updateData.openedCount = (campaign.openedCount || 0) + 1;
          } else if (eventType === 'click') {
            updateData.clickedCount = (campaign.clickedCount || 0) + 1;
          } else if (eventType === 'bounce' || eventType === 'dropped') {
            updateData.bouncedCount = (campaign.bouncedCount || 0) + 1;
          }

          if (Object.keys(updateData).length > 0) {
            await supabaseAdmin()
              .from('campaigns')
              .update(updateData)
              .eq('id', campaignId);
          }
        }

        // Update contact engagement score
        let scoreChange = 0;
        if (eventType === 'open') scoreChange = 10;
        else if (eventType === 'click') scoreChange = 20;
        else if (eventType === 'bounce') scoreChange = -50;
        else if (eventType === 'spam_report') scoreChange = -100;

        if (scoreChange !== 0) {
          await supabaseAdmin()
            .from('contacts')
            .update({
              emailEngagementScore: (contact.emailEngagementScore || 0) + scoreChange,
            })
            .eq('id', contact.id);
        }

        // Mark contact as unsubscribed if spam_report or unsubscribe
        if (eventType === 'spam_report' || eventType === 'unsubscribe') {
          await supabaseAdmin()
            .from('contacts')
            .update({ status: 'UNSUBSCRIBED' })
            .eq('id', contact.id);
        }
      } catch (error) {
        // Continue processing other events
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
