import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

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
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'DEV')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch dashboard stats
    const [
      totalErrors24h,
      recentDeployments,
      errorLogs,
      featureFlags,
      webhookFailures24h
    ] = await Promise.all([
      // Total errors in last 24 hours
      prisma.error_logs.count({
        where: {
          firstSeen: {
            gte: twentyFourHoursAgo
          }
        }
      }),

      // Recent deployments
      prisma.deployments.findMany({
        orderBy: {
          deployedAt: 'desc'
        },
        take: 5
      }),

      // Recent error logs
      prisma.error_logs.findMany({
        where: {
          isResolved: false
        },
        orderBy: {
          firstSeen: 'desc'
        },
        take: 5
      }),

      // Feature flags
      prisma.feature_flags.findMany({
        select: {
          enabled: true
        }
      }),

      // Webhook failures in last 24 hours
      prisma.webhook_logs.count({
        where: {
          status: 'Failed'
        }
      })
    ]);

    // Calculate error rate (assuming some baseline request count)
    // For now, we'll use a simple percentage based on error count
    const errorRate24h = totalErrors24h > 0 ? Math.min(totalErrors24h / 100, 100) : 0;

    // Determine system health based on metrics
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate24h > 10 || webhookFailures24h > 10) {
      systemHealth = 'critical';
    } else if (errorRate24h > 5 || webhookFailures24h > 5) {
      systemHealth = 'warning';
    }

    const activeFeatureFlags = featureFlags.filter(f => f.enabled).length;
    const totalFeatureFlags = featureFlags.length;

    const stats = {
      systemHealth,
      errorRate24h,
      recentDeployments: recentDeployments.map(deployment => ({
        id: deployment.id,
        version: deployment.version,
        status: deployment.status,
        deployedAt: deployment.deployedAt.toISOString(),
        deployedBy: deployment.deployedBy || 'System'
      })),
      errorLogs: errorLogs.map(error => ({
        id: error.id,
        errorType: error.errorType,
        message: error.message.substring(0, 100) + (error.message.length > 100 ? '...' : ''),
        severity: error.severity,
        timestamp: error.firstSeen.toISOString()
      })),
      activeFeatureFlags,
      totalFeatureFlags,
      webhookFailures24h,
      cacheStatus: 'Operational' // This would come from actual cache service
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
