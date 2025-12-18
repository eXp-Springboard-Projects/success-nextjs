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
    const { days = '30' } = req.query;
    const daysAgo = parseInt(String(days));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Sends over time
    const sendsOverTime = await prisma.$queryRaw<Array<{
      date: string;
      sends: number;
      opens: number;
      clicks: number;
    }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as sends,
        COUNT(CASE WHEN event = 'opened' THEN 1 END) as opens,
        COUNT(CASE WHEN event = 'clicked' THEN 1 END) as clicks
      FROM email_events
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Top campaigns
    const topCampaigns = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      sent: bigint;
      opens: bigint;
      clicks: bigint;
    }>>`
      SELECT
        c.id,
        c.name,
        c."sentCount" as sent,
        c."openedCount" as opens,
        c."clickedCount" as clicks
      FROM campaigns c
      WHERE c."sentAt" >= ${cutoffDate}
      ORDER BY c."openedCount" DESC
      LIMIT 10
    `;

    const formattedCampaigns = topCampaigns.map(c => ({
      name: c.name,
      sent: Number(c.sent),
      openRate: Number(c.sent) > 0 ? (Number(c.opens) / Number(c.sent)) * 100 : 0,
      clickRate: Number(c.sent) > 0 ? (Number(c.clicks) / Number(c.sent)) * 100 : 0,
    }));

    // Average rates
    const totalSent = topCampaigns.reduce((sum, c) => sum + Number(c.sent), 0);
    const totalOpens = topCampaigns.reduce((sum, c) => sum + Number(c.opens), 0);
    const totalClicks = topCampaigns.reduce((sum, c) => sum + Number(c.clicks), 0);

    const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const avgClickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

    // Unsubscribe rate
    const unsubscribeCount = await prisma.email_preferences.count({
      where: {
        unsubscribed: true,
        unsubscribedAt: { gte: cutoffDate },
      },
    });

    const unsubscribeRate = totalSent > 0 ? (unsubscribeCount / totalSent) * 100 : 0;

    return res.status(200).json({
      sendsOverTime: sendsOverTime.map(s => ({
        date: s.date,
        sends: Number(s.sends),
        opens: Number(s.opens),
        clicks: Number(s.clicks),
      })),
      topCampaigns: formattedCampaigns,
      avgOpenRate,
      avgClickRate,
      unsubscribeRate,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch email reports' });
  }
}
