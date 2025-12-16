import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

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
    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${id}
    `;

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const c = campaign[0];

    if (c.status !== 'draft' && c.status !== 'scheduled') {
      return res.status(400).json({ error: 'Campaign cannot be sent in current status' });
    }

    // Get recipients from list
    const recipients = c.list_id
      ? await prisma.$queryRaw<Array<any>>`
          SELECT c.id, c.email, c.first_name, c.last_name
          FROM contacts c
          JOIN contact_list_members clm ON c.id = clm.contact_id
          WHERE clm.list_id = ${c.list_id} AND c.email_status = 'subscribed'
        `
      : [];

    // In real implementation, this would queue emails for sending
    // For now, we'll just create email_sends records
    for (const recipient of recipients) {
      await prisma.$executeRaw`
        INSERT INTO email_sends (
          id, template_id, campaign_id, contact_id, to_email, from_email, from_name,
          subject, status
        ) VALUES (
          ${nanoid()}, ${c.template_id}, ${id}, ${recipient.id}, ${recipient.email},
          ${c.from_email}, ${c.from_name}, ${c.subject}, 'queued'
        )
      `;
    }

    // Update campaign
    await prisma.$executeRaw`
      UPDATE email_campaigns
      SET status = 'sending',
          sent_at = CURRENT_TIMESTAMP,
          total_recipients = ${recipients.length},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const updated = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${id}
    `;

    return res.status(200).json(updated[0]);
  } catch (error) {
    console.error('Error sending campaign:', error);
    return res.status(500).json({ error: 'Failed to send campaign' });
  }
}
