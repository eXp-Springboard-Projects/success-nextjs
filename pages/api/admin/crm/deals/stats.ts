import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
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

  try {
    const stats = await prisma.$queryRaw<Array<any>>`
      SELECT
        s.id as stage_id,
        s.name as stage_name,
        s.color as stage_color,
        s.order as stage_order,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value), 0) as total_value
      FROM deal_stages s
      LEFT JOIN deals d ON s.id = d.stage_id AND d.status = 'open'
      GROUP BY s.id, s.name, s.color, s.order
      ORDER BY s.order
    `;

    const totalStats = await prisma.$queryRaw<Array<any>>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') as open_deals,
        COUNT(*) FILTER (WHERE status = 'won') as won_deals,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_deals,
        COALESCE(SUM(value) FILTER (WHERE status = 'open'), 0) as open_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'won'), 0) as won_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'lost'), 0) as lost_value
      FROM deals
    `;

    return res.status(200).json({
      stages: stats,
      totals: totalStats[0],
    });
  } catch (error) {
    console.error('Error fetching deal stats:', error);
    return res.status(500).json({ error: 'Failed to fetch deal stats' });
  }
}
