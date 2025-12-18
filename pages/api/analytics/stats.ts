import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get analytics data
    const analytics = await prisma.content_analytics.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Aggregate statistics
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalUniqueVisitors = new Set(
      analytics.map(a => {
        try {
          const meta = JSON.parse(a.metadata as string);
          return meta.sessionId || meta.ipAddress;
        } catch {
          return null;
        }
      }).filter(Boolean)
    ).size;

    // Device breakdown
    const deviceStats = analytics.reduce((acc: any, a) => {
      try {
        const meta = JSON.parse(a.metadata as string);
        const device = meta.deviceType || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
      } catch {}
      return acc;
    }, {});

    // Browser breakdown
    const browserStats = analytics.reduce((acc: any, a) => {
      try {
        const meta = JSON.parse(a.metadata as string);
        const browser = meta.browser || 'unknown';
        acc[browser] = (acc[browser] || 0) + 1;
      } catch {}
      return acc;
    }, {});

    // Top pages
    const pageViews: Record<string, any> = {};
    analytics.forEach(a => {
      try {
        const meta = JSON.parse(a.metadata as string);
        const page = meta.page || 'unknown';
        const title = meta.title || page;

        if (!pageViews[page]) {
          pageViews[page] = {
            page,
            title,
            views: 0,
            uniqueVisitors: new Set(),
          };
        }

        pageViews[page].views += 1;
        pageViews[page].uniqueVisitors.add(meta.sessionId || meta.ipAddress);
      } catch {}
    });

    const topPages = Object.values(pageViews)
      .map((p: any) => ({
        page: p.page,
        title: p.title,
        views: p.views,
        uniqueVisitors: p.uniqueVisitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Referrer breakdown
    const referrerStats: Record<string, number> = {};
    analytics.forEach(a => {
      try {
        const meta = JSON.parse(a.metadata as string);
        const referrer = meta.referrer || 'direct';
        const domain = referrer === 'direct' ? 'direct' : new URL(referrer).hostname;
        referrerStats[domain] = (referrerStats[domain] || 0) + 1;
      } catch {
        referrerStats['direct'] = (referrerStats['direct'] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(referrerStats)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily views for chart
    const dailyViews: Record<string, number> = {};
    analytics.forEach(a => {
      const date = a.createdAt.toISOString().split('T')[0];
      dailyViews[date] = (dailyViews[date] || 0) + a.views;
    });

    const viewsChart = Object.entries(dailyViews)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Average time on page
    const avgTimeOnPage = analytics
      .filter(a => a.avgTimeOnPage > 0)
      .reduce((sum, a) => sum + a.avgTimeOnPage, 0) /
      (analytics.filter(a => a.avgTimeOnPage > 0).length || 1);

    // Bounce rate
    const bounceRate = analytics.length > 0
      ? (analytics.reduce((sum, a) => sum + a.bounceRate, 0) / analytics.length) * 100
      : 0;

    return res.status(200).json({
      period,
      startDate,
      endDate: now,
      overview: {
        totalViews,
        uniqueVisitors: totalUniqueVisitors,
        avgTimeOnPage: Math.round(avgTimeOnPage),
        bounceRate: Math.round(bounceRate),
      },
      devices: deviceStats,
      browsers: browserStats,
      topPages,
      topReferrers,
      viewsChart,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
