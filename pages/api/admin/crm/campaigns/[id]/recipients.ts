import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  try {
    const recipients = await prisma.$queryRaw<Array<any>>`
      SELECT
        es.id,
        es.to_email,
        es.status,
        es.sent_at,
        es.delivered_at,
        es.opened_at,
        es.clicked_at,
        es.bounced_at,
        es.failed_at,
        es.error_message,
        c.first_name,
        c.last_name
      FROM email_sends es
      LEFT JOIN contacts c ON es.contact_id = c.id
      WHERE es.campaign_id = ${id}
      ORDER BY es.sent_at DESC
    `;

    return res.status(200).json({ recipients });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign recipients' });
  }
}
