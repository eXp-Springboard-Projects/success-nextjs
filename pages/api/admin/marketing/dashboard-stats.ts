import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { hasDepartmentAccess } from '@/lib/departmentAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'MARKETING')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get active campaigns count
    const activeCampaignsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM email_campaigns
      WHERE status = 'active'
    `;
    const activeCampaigns = Number(activeCampaignsResult[0]?.count || 0);

    // Calculate email open rate
    const emailStatsResult = await prisma.$queryRaw<Array<{ total_sent: bigint; total_opened: bigint }>>`
      SELECT
        COUNT(*) as total_sent,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as total_opened
      FROM email_sends
      WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const totalSent = Number(emailStatsResult[0]?.total_sent || 0);
    const totalOpened = Number(emailStatsResult[0]?.total_opened || 0);
    const emailOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    // Calculate conversion rate from landing pages
    const landingPagesResult = await prisma.$queryRaw<Array<{ total_views: bigint; total_conversions: bigint }>>`
      SELECT
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(conversions), 0) as total_conversions
      FROM landing_pages
      WHERE status = 'published'
    `;
    const totalViews = Number(landingPagesResult[0]?.total_views || 0);
    const totalConversions = Number(landingPagesResult[0]?.total_conversions || 0);
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    // Get site traffic (using email sends as proxy)
    const trafficResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM email_sends
      WHERE sent_at >= CURRENT_DATE
    `;
    const siteTrafficToday = Number(trafficResult[0]?.count || 0);

    // Get top performing campaigns
    const topCampaignsData = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.id,
        c.name,
        c.type,
        COUNT(CASE WHEN s.clicked_at IS NOT NULL THEN 1 END) as conversions,
        CASE
          WHEN COUNT(*) > 0
          THEN (COUNT(CASE WHEN s.clicked_at IS NOT NULL THEN 1 END)::float / COUNT(*)::float) * 100
          ELSE 0
        END as click_through_rate
      FROM email_campaigns c
      LEFT JOIN email_sends s ON c.id = s.campaign_id
      WHERE c.status IN ('active', 'completed')
        AND c.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.id, c.name, c.type
      HAVING COUNT(*) > 0
      ORDER BY conversions DESC
      LIMIT 5
    `;

    const topCampaigns = topCampaignsData.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type || 'Email',
      conversions: Number(campaign.conversions || 0),
      clickThroughRate: Number(campaign.click_through_rate || 0),
    }));

    const stats = {
      siteTrafficToday,
      emailOpenRate,
      activeCampaigns,
      conversionRate,
      topCampaigns,
    };

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Error fetching Marketing dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
