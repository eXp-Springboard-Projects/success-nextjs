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

    // Contacts over time
    const contactsOverTime = await prisma.$queryRaw<Array<{
      date: string;
      count: bigint;
    }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM contacts
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Contacts by source
    const contactsBySource = await prisma.$queryRaw<Array<{
      source: string;
      count: bigint;
    }>>`
      SELECT
        COALESCE(source, 'Unknown') as source,
        COUNT(*) as count
      FROM contacts
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY source
      ORDER BY count DESC
    `;

    // Lead score distribution
    const leadScoreDistribution = await prisma.$queryRaw<Array<{
      range: string;
      count: bigint;
    }>>`
      SELECT
        CASE
          WHEN "leadScore" >= 100 THEN 'Hot (100+)'
          WHEN "leadScore" >= 50 THEN 'Warm (50-99)'
          WHEN "leadScore" >= 20 THEN 'Medium (20-49)'
          WHEN "leadScore" > 0 THEN 'Cold (1-19)'
          ELSE 'None (0)'
        END as range,
        COUNT(*) as count
      FROM contacts
      WHERE status = 'ACTIVE'
      GROUP BY range
      ORDER BY
        CASE range
          WHEN 'Hot (100+)' THEN 1
          WHEN 'Warm (50-99)' THEN 2
          WHEN 'Medium (20-49)' THEN 3
          WHEN 'Cold (1-19)' THEN 4
          ELSE 5
        END
    `;

    // Total contacts
    const totalContacts = await prisma.contacts.count({
      where: { status: 'ACTIVE' },
    });

    // Growth rate (compare this period to previous period)
    const previousCutoff = new Date(cutoffDate);
    previousCutoff.setDate(previousCutoff.getDate() - daysAgo);

    const currentPeriodCount = await prisma.contacts.count({
      where: {
        createdAt: { gte: cutoffDate },
      },
    });

    const previousPeriodCount = await prisma.contacts.count({
      where: {
        createdAt: {
          gte: previousCutoff,
          lt: cutoffDate,
        },
      },
    });

    const growthRate = previousPeriodCount > 0
      ? ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100
      : 0;

    return res.status(200).json({
      contactsOverTime: contactsOverTime.map(c => ({
        date: c.date,
        count: Number(c.count),
      })),
      contactsBySource: contactsBySource.map(c => ({
        name: c.source,
        value: Number(c.count),
      })),
      leadScoreDistribution: leadScoreDistribution.map(l => ({
        range: l.range,
        count: Number(l.count),
      })),
      totalContacts,
      growthRate,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch contact reports' });
  }
}
