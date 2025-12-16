import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, optInMarketing, optInTransactional, reason } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find email by token
    const prefs = await prisma.$queryRaw<Array<{ email: string }>>`
      SELECT email FROM email_preferences WHERE unsubscribe_token = ${token}
    `;

    if (prefs.length === 0) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const email = prefs[0].email;

    // Update preferences
    await prisma.$executeRaw`
      UPDATE email_preferences
      SET
        opt_in_marketing = ${optInMarketing},
        opt_in_transactional = ${optInTransactional},
        unsubscribed = ${!optInMarketing && !optInTransactional},
        unsubscribe_reason = ${reason || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE unsubscribe_token = ${token}
    `;

    // Update contact status if they unsubscribed from everything
    if (!optInMarketing && !optInTransactional) {
      await prisma.$executeRaw`
        UPDATE crm_contacts
        SET email_status = 'unsubscribed'
        WHERE email = ${email}
      `;

      // Add activity
      await prisma.$executeRaw`
        INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
        SELECT
          ${nanoid()}, id, 'unsubscribed',
          'Unsubscribed from all emails',
          ${JSON.stringify({ reason })}::jsonb
        FROM crm_contacts
        WHERE email = ${email}
      `;
    }

    return res.status(200).json({ success: true, email });
  } catch (error) {
    console.error('Error updating unsubscribe preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
