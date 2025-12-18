import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

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
        const contact = await prisma.contacts.findUnique({
          where: { email: emailAddress },
        });

        if (!contact) {
          continue;
        }

        // Extract campaign ID from custom args or sg_message_id
        const campaignId = event.campaignId || event['sg_campaign_id'];

        if (!campaignId) {
          continue;
        }

        // Create email event
        await prisma.email_events.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId,
            contactId: contact.id,
            emailAddress,
            event: eventType,
            eventData: event,
          },
        });

        // Update campaign stats
        const campaign = await prisma.campaigns.findUnique({
          where: { id: campaignId },
        });

        if (campaign) {
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
            await prisma.campaigns.update({
              where: { id: campaignId },
              data: updateData,
            });
          }
        }

        // Update contact engagement score
        let scoreChange = 0;
        if (eventType === 'open') scoreChange = 10;
        else if (eventType === 'click') scoreChange = 20;
        else if (eventType === 'bounce') scoreChange = -50;
        else if (eventType === 'spam_report') scoreChange = -100;

        if (scoreChange !== 0) {
          await prisma.contacts.update({
            where: { id: contact.id },
            data: {
              emailEngagementScore: (contact.emailEngagementScore || 0) + scoreChange,
            },
          });
        }

        // Mark contact as unsubscribed if spam_report or unsubscribe
        if (eventType === 'spam_report' || eventType === 'unsubscribe') {
          await prisma.contacts.update({
            where: { id: contact.id },
            data: {
              status: 'UNSUBSCRIBED',
            },
          });
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
