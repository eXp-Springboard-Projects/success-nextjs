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
    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${id}
    `;

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get email send stats
    const stats = await prisma.$queryRaw<Array<any>>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
        COUNT(*) FILTER (WHERE bounced_at IS NOT NULL) as bounced,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM email_sends
      WHERE campaign_id = ${id}
    `;

    // Get timeline data (grouped by day)
    const timeline = await prisma.$queryRaw<Array<any>>`
      SELECT
        DATE(opened_at) as date,
        COUNT(*) as opens,
        COUNT(DISTINCT clicked_at) as clicks
      FROM email_sends
      WHERE campaign_id = ${id} AND opened_at IS NOT NULL
      GROUP BY DATE(opened_at)
      ORDER BY DATE(opened_at)
    `;

    const c = campaign[0];
    const s = stats[0];

    const openRate = c.total_sent > 0 ? ((Number(s.opened) / c.total_sent) * 100).toFixed(2) : '0.00';
    const clickRate = c.total_sent > 0 ? ((Number(s.clicked) / c.total_sent) * 100).toFixed(2) : '0.00';

    return res.status(200).json({
      campaign: c,
      stats: {
        sent: Number(s.sent) || 0,
        delivered: Number(s.delivered) || 0,
        opened: Number(s.opened) || 0,
        clicked: Number(s.clicked) || 0,
        bounced: Number(s.bounced) || 0,
        failed: Number(s.failed) || 0,
        openRate,
        clickRate,
      },
      timeline,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign report' });
  }
}
