import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
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
    // Get date ranges
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total contacts with trend
    const totalContacts = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count FROM contacts
    `;

    const contactsLastMonth = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count FROM contacts
      WHERE created_at < ${firstOfMonth.toISOString()}
    `;

    const contactsTrend = totalContacts[0].count - contactsLastMonth[0].count;

    // Active deals
    const activeDeals = await prisma.$queryRaw<Array<{ count: number; total_value: number }>>`
      SELECT
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0)::float as total_value
      FROM deals
      WHERE status = 'open'
    `;

    // Open tickets
    const openTickets = await prisma.$queryRaw<Array<{ count: number; avg_resolution: number }>>`
      SELECT
        COUNT(*) FILTER (WHERE status != 'closed')::int as count,
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
          ) FILTER (WHERE resolved_at IS NOT NULL),
          0
        )::float as avg_resolution
      FROM tickets
    `;

    // Emails sent this month
    const emailsThisMonth = await prisma.$queryRaw<Array<{
      sent: number;
      opened: number;
    }>>`
      SELECT
        COUNT(*)::int as sent,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::int as opened
      FROM email_sends
      WHERE sent_at >= ${firstOfThisMonth.toISOString()}
    `;

    const openRate = emailsThisMonth[0].sent > 0
      ? ((emailsThisMonth[0].opened / emailsThisMonth[0].sent) * 100).toFixed(1)
      : '0.0';

    // Recent activities (across contacts, deals, tickets)
    const contactActivities = await prisma.$queryRaw<Array<any>>`
      SELECT
        'contact' as source,
        type,
        description,
        created_at,
        created_by
      FROM contact_activities
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const dealActivities = await prisma.$queryRaw<Array<any>>`
      SELECT
        'deal' as source,
        type,
        description,
        created_at,
        created_by
      FROM deal_activities
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentActivities = [...contactActivities, ...dealActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    // Top performing campaigns
    const topCampaigns = await prisma.$queryRaw<Array<any>>`
      SELECT
        id,
        name,
        total_sent,
        total_opened,
        total_clicked,
        CASE
          WHEN total_sent > 0 THEN (total_opened::float / total_sent * 100)
          ELSE 0
        END as open_rate,
        sent_at
      FROM email_campaigns
      WHERE status = 'completed' OR status = 'sending'
      ORDER BY open_rate DESC
      LIMIT 5
    `;

    // Pipeline summary
    const pipelineSummary = await prisma.$queryRaw<Array<any>>`
      SELECT
        s.id as stage_id,
        s.name as stage_name,
        s.color as stage_color,
        s.order as stage_order,
        COUNT(d.id)::int as deal_count,
        COALESCE(SUM(d.value), 0)::float as total_value
      FROM deal_stages s
      LEFT JOIN deals d ON s.id = d.stage_id AND d.status = 'open'
      GROUP BY s.id, s.name, s.color, s.order
      ORDER BY s.order
    `;

    // Tickets by priority
    const ticketsByPriority = await prisma.$queryRaw<Array<any>>`
      SELECT
        priority,
        COUNT(*)::int as count
      FROM tickets
      WHERE status != 'closed'
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `;

    return res.status(200).json({
      stats: {
        totalContacts: totalContacts[0].count,
        contactsTrend,
        activeDeals: activeDeals[0].count,
        dealsTotalValue: activeDeals[0].total_value,
        openTickets: openTickets[0].count,
        avgResolutionTime: openTickets[0].avg_resolution,
        emailsSent: emailsThisMonth[0].sent,
        emailOpenRate: openRate,
      },
      recentActivities,
      topCampaigns,
      pipelineSummary,
      ticketsByPriority,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
