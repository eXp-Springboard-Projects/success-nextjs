import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const BATCH_SIZE = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  try {
    const campaigns = await prisma.campaigns.findMany({
      where: { id },
      include: { email_templates: true },
    });

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaigns[0];

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Campaign cannot be sent in current status' });
    }

    // Get campaign contacts
    const campaignContacts = await prisma.campaign_contacts.findMany({
      where: { campaignId: id },
      include: { contacts: true },
    });

    if (campaignContacts.length === 0) {
      return res.status(400).json({ error: 'No recipients found for this campaign' });
    }

    // Filter out unsubscribed contacts
    const validRecipients = [];
    for (const cc of campaignContacts) {
      const contact = cc.contacts;

      // Check unsubscribe status in email_preferences
      const prefs = await prisma.email_preferences.findFirst({
        where: { email: contact.email },
      });

      // Skip if unsubscribed
      if (prefs && prefs.unsubscribed) {
        continue;
      }

      // Skip if contact is not active
      if (contact.status !== 'ACTIVE') {
        continue;
      }

      validRecipients.push(contact);
    }

    if (validRecipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients after filtering unsubscribes' });
    }

    // Queue emails in batches
    let totalQueued = 0;
    for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
      const batch = validRecipients.slice(i, i + BATCH_SIZE);

      for (const recipient of batch) {
        // Generate unsubscribe token
        const unsubToken = nanoid(32);

        // Ensure email_preferences record exists with unsubscribe token
        await prisma.$executeRaw`
          INSERT INTO email_preferences (
            id, email, "contactId", "unsubscribeToken", "createdAt", "updatedAt"
          ) VALUES (
            ${nanoid()}, ${recipient.email}, ${recipient.id}, ${unsubToken},
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT (email)
          DO UPDATE SET "unsubscribeToken" = ${unsubToken}, "updatedAt" = CURRENT_TIMESTAMP
        `;

        // Create email event
        await prisma.email_events.create({
          data: {
            id: nanoid(),
            campaignId: id,
            contactId: recipient.id,
            emailAddress: recipient.email,
            event: 'queued',
            eventData: {
              subject: campaign.subject,
              fromName: session.user.name,
              fromEmail: 'hello@success.com',
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://success.com'}/unsubscribe?token=${unsubToken}`,
            },
          },
        });

        totalQueued++;
      }

      // Small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < validRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update campaign status
    await prisma.campaigns.update({
      where: { id },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
        sentCount: totalQueued,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      totalQueued,
      totalFiltered: campaignContacts.length - validRecipients.length,
      message: `Queued ${totalQueued} emails for sending`,
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return res.status(500).json({ error: 'Failed to send campaign' });
  }
}
