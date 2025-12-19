import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Email Analytics
      const [emailStats, campaigns, emailTimeseries] = await Promise.all([
        // Email stats - using email_events table
        prisma.$queryRaw<Array<{
          total_sent: bigint;
          total_opens: bigint;
          total_clicks: bigint;
          total_bounced: bigint;
          total_unsubscribed: bigint;
        }>>`
          SELECT
            COUNT(CASE WHEN event = 'sent' THEN 1 END) as total_sent,
            COUNT(CASE WHEN event = 'opened' THEN 1 END) as total_opens,
            COUNT(CASE WHEN event = 'clicked' THEN 1 END) as total_clicks,
            COUNT(CASE WHEN event = 'bounced' THEN 1 END) as total_bounced,
            0 as total_unsubscribed
          FROM email_events
          WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
        `,

        // Top campaigns
        prisma.campaigns.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          select: {
            id: true,
            name: true,
            sentCount: true,
            openedCount: true,
            clickedCount: true,
          },
          orderBy: { openedCount: 'desc' },
          take: 5,
        }),

        // Email timeseries - using email_events
        prisma.$queryRaw<Array<{
          date: Date;
          sends: bigint;
          opens: bigint;
          clicks: bigint;
        }>>`
          SELECT
            DATE("createdAt") as date,
            COUNT(CASE WHEN event = 'sent' THEN 1 END) as sends,
            COUNT(CASE WHEN event = 'opened' THEN 1 END) as opens,
            COUNT(CASE WHEN event = 'clicked' THEN 1 END) as clicks
          FROM email_events
          WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
      ]);

      const emailStatsData = emailStats[0];
      const totalSent = Number(emailStatsData.total_sent);
      const totalOpens = Number(emailStatsData.total_opens);
      const totalClicks = Number(emailStatsData.total_clicks);
      const totalBounced = Number(emailStatsData.total_bounced);

      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

      // Contact Analytics
      const [contactTimeseries, contactsBySource, contactsByStatus] = await Promise.all([
        prisma.$queryRaw<Array<{
          date: Date;
          count: bigint;
        }>>`
          SELECT
            DATE(created_at) as date,
            COUNT(*) as count
          FROM contacts
          WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,

        prisma.$queryRaw<Array<{
          source: string;
          count: bigint;
        }>>`
          SELECT
            COALESCE(source, 'Unknown') as source,
            COUNT(*) as count
          FROM contacts
          WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY source
          ORDER BY count DESC
        `,

        prisma.$queryRaw<Array<{
          status: string;
          count: bigint;
        }>>`
          SELECT
            status,
            COUNT(*) as count
          FROM contacts
          WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY status
        `,
      ]);

      // Deal Analytics (if deals table exists)
      let dealStats: {
        totalValue: number;
        winRate: number;
        avgDealSize: number;
        dealsByStage: Array<{ stage: string; count: number; value: number }>;
        dealsTimeseries: Array<{ date: string; count: number; value: number }>;
      } = {
        totalValue: 0,
        winRate: 0,
        avgDealSize: 0,
        dealsByStage: [],
        dealsTimeseries: [],
      };

      try {
        const [dealsData, dealsByStage, dealsTimeseries] = await Promise.all([
          prisma.$queryRaw<Array<{
            total_value: any;
            won_count: bigint;
            total_count: bigint;
          }>>`
            SELECT
              SUM(value) as total_value,
              COUNT(CASE WHEN stage = 'WON' THEN 1 END) as won_count,
              COUNT(*) as total_count
            FROM deals
            WHERE created_at >= ${start} AND created_at <= ${end}
          `,

          prisma.$queryRaw<Array<{
            stage: string;
            count: bigint;
            total_value: any;
          }>>`
            SELECT
              stage,
              COUNT(*) as count,
              SUM(value) as total_value
            FROM deals
            WHERE created_at >= ${start} AND created_at <= ${end}
            GROUP BY stage
            ORDER BY
              CASE stage
                WHEN 'LEAD' THEN 1
                WHEN 'QUALIFIED' THEN 2
                WHEN 'PROPOSAL' THEN 3
                WHEN 'NEGOTIATION' THEN 4
                WHEN 'WON' THEN 5
                WHEN 'LOST' THEN 6
                ELSE 7
              END
          `,

          prisma.$queryRaw<Array<{
            date: Date;
            count: bigint;
            total_value: any;
          }>>`
            SELECT
              DATE(created_at) as date,
              COUNT(*) as count,
              SUM(value) as total_value
            FROM deals
            WHERE created_at >= ${start} AND created_at <= ${end}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `,
        ]);

        const dealsDataRow = dealsData[0];
        const totalValue = Number(dealsDataRow.total_value || 0);
        const wonCount = Number(dealsDataRow.won_count);
        const totalCount = Number(dealsDataRow.total_count);
        const winRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;
        const avgDealSize = totalCount > 0 ? totalValue / totalCount : 0;

        dealStats = {
          totalValue,
          winRate,
          avgDealSize,
          dealsByStage: dealsByStage.map((d) => ({
            stage: d.stage,
            count: Number(d.count),
            value: Number(d.total_value || 0),
          })),
          dealsTimeseries: dealsTimeseries.map((d) => ({
            date: d.date.toISOString().split('T')[0],
            count: Number(d.count),
            value: Number(d.total_value || 0),
          })),
        };
      } catch (error) {
        // Deals table might not exist
}

      // Ticket Analytics (if tickets table exists)
      let ticketStats: {
        totalTickets: number;
        avgResolutionTime: number;
        ticketsByCategory: Array<{ category: string; count: number }>;
        ticketsByPriority: Array<{ priority: string; count: number }>;
        ticketsTimeseries: Array<{ date: string; count: number }>;
      } = {
        totalTickets: 0,
        avgResolutionTime: 0,
        ticketsByCategory: [],
        ticketsByPriority: [],
        ticketsTimeseries: [],
      };

      try {
        const [ticketsData, ticketsByCategory, ticketsByPriority, ticketsTimeseries] = await Promise.all([
          prisma.$queryRaw<Array<{
            total_count: bigint;
            avg_resolution_hours: any;
          }>>`
            SELECT
              COUNT(*) as total_count,
              AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours
            FROM tickets
            WHERE created_at >= ${start} AND created_at <= ${end}
          `,

          prisma.$queryRaw<Array<{
            category: string;
            count: bigint;
          }>>`
            SELECT
              category,
              COUNT(*) as count
            FROM tickets
            WHERE created_at >= ${start} AND created_at <= ${end}
            GROUP BY category
            ORDER BY count DESC
          `,

          prisma.$queryRaw<Array<{
            priority: string;
            count: bigint;
          }>>`
            SELECT
              priority,
              COUNT(*) as count
            FROM tickets
            WHERE created_at >= ${start} AND created_at <= ${end}
            GROUP BY priority
            ORDER BY
              CASE priority
                WHEN 'URGENT' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                WHEN 'LOW' THEN 4
                ELSE 5
              END
          `,

          prisma.$queryRaw<Array<{
            date: Date;
            count: bigint;
          }>>`
            SELECT
              DATE(created_at) as date,
              COUNT(*) as count
            FROM tickets
            WHERE created_at >= ${start} AND created_at <= ${end}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `,
        ]);

        const ticketsDataRow = ticketsData[0];

        ticketStats = {
          totalTickets: Number(ticketsDataRow.total_count),
          avgResolutionTime: Number(ticketsDataRow.avg_resolution_hours || 0),
          ticketsByCategory: ticketsByCategory.map((t) => ({
            category: t.category,
            count: Number(t.count),
          })),
          ticketsByPriority: ticketsByPriority.map((t) => ({
            priority: t.priority,
            count: Number(t.count),
          })),
          ticketsTimeseries: ticketsTimeseries.map((t) => ({
            date: t.date.toISOString().split('T')[0],
            count: Number(t.count),
          })),
        };
      } catch (error) {
        // Tickets table might not exist
}

      // Unsubscribe rate
      const unsubscribeCount = await prisma.email_preferences.count({
        where: {
          unsubscribed: true,
          unsubscribedAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const unsubscribeRate = totalSent > 0 ? (unsubscribeCount / totalSent) * 100 : 0;

      return res.status(200).json({
        email: {
          totalSent,
          totalOpens,
          totalClicks,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
          unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
          timeseries: emailTimeseries.map((t) => ({
            date: t.date,
            sends: Number(t.sends),
            opens: Number(t.opens),
            clicks: Number(t.clicks),
          })),
          topCampaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            sent: c.sentCount,
            opens: c.openedCount,
            clicks: c.clickedCount,
            openRate: c.sentCount > 0 ? Math.round((c.openedCount / c.sentCount) * 10000) / 100 : 0,
          })),
        },
        contacts: {
          timeseries: contactTimeseries.map((c) => ({
            date: c.date,
            count: Number(c.count),
          })),
          bySource: contactsBySource.map((c) => ({
            source: c.source,
            count: Number(c.count),
          })),
          byStatus: contactsByStatus.map((c) => ({
            status: c.status,
            count: Number(c.count),
          })),
        },
        deals: dealStats,
        tickets: ticketStats,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
