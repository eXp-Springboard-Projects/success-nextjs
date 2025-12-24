import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { sendCampaignEmail, sendEmailBatch } from '../../../lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (if set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (providedSecret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabase = supabaseAdmin();

  try {
    // Find campaigns where status="SCHEDULED" AND scheduledAt <= now
    const now = new Date().toISOString();
    const { data: scheduledCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        email_templates (*),
        campaign_contacts (
          *,
          contacts (*)
        )
      `)
      .eq('status', 'SCHEDULED')
      .lte('scheduledAt', now);

    if (campaignsError) {
      throw campaignsError;
    }

    if (scheduledCampaigns.length === 0) {
      return res.status(200).json({
        message: 'No scheduled campaigns to process',
        processedCount: 0,
      });
    }

    const results = [];

    for (const campaign of scheduledCampaigns) {
      try {
        if (!campaign.email_templates) {
          continue;
        }

        type CampaignContact = typeof campaign.campaign_contacts[number];
        const contacts = campaign.campaign_contacts.map((cc: CampaignContact) => cc.contacts);

        if (contacts.length === 0) {
          continue;
        }

        const htmlTemplate = campaign.email_templates.html;
        const subject = campaign.subject;

        // Create email sending tasks
        type Contact = NonNullable<typeof contacts[number]>;
        const emailTasks = contacts.map((contact: Contact) => {
          return async () => {
            const result = await sendCampaignEmail(contact, subject, htmlTemplate);

            // Log the email event
            if (result.success) {
              await supabase
                .from('email_events')
                .insert({
                  id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  campaignId: campaign.id,
                  contactId: contact.id,
                  emailAddress: contact.email,
                  event: 'sent',
                  eventData: {},
                });
            }

            return result;
          };
        });

        // Send in batches of 100 with 1 second delay
        const { sentCount, failedCount, errors } = await sendEmailBatch(emailTasks, 100, 1000);

        // Update campaign with stats
        await supabase
          .from('campaigns')
          .update({
            status: 'SENT',
            sentAt: new Date().toISOString(),
            sentCount,
            failedCount,
            sendErrors: errors.length > 0 ? errors : null,
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          sentCount,
          failedCount,
          totalContacts: contacts.length,
        });
      } catch (error: any) {
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      message: 'Campaigns processed successfully',
      processedCount: results.length,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
