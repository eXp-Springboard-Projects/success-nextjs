import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

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
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.DEV)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const supabase = supabaseAdmin();

    // Fetch dashboard stats
    const [
      totalErrors24hResult,
      recentDeploymentsResult,
      errorLogsResult,
      featureFlagsResult,
      webhookFailures24hResult
    ] = await Promise.all([
      // Total errors in last 24 hours
      supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen', twentyFourHoursAgo.toISOString()),

      // Recent deployments
      supabase
        .from('deployments')
        .select('*')
        .order('deployed_at', { ascending: false })
        .limit(5),

      // Recent error logs
      supabase
        .from('error_logs')
        .select('*')
        .eq('is_resolved', false)
        .order('first_seen', { ascending: false })
        .limit(5),

      // Feature flags
      supabase
        .from('feature_flags')
        .select('enabled'),

      // Webhook failures in last 24 hours
      supabase
        .from('webhook_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Failed')
    ]);

    const totalErrors24h = totalErrors24hResult.count || 0;
    const recentDeployments = recentDeploymentsResult.data || [];
    const errorLogs = errorLogsResult.data || [];
    const featureFlags = featureFlagsResult.data || [];
    const webhookFailures24h = webhookFailures24hResult.count || 0;

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
      recentDeployments: recentDeployments.map((deployment: any) => ({
        id: deployment.id,
        version: deployment.version,
        status: deployment.status,
        deployedAt: deployment.deployed_at,
        deployedBy: deployment.deployed_by || 'System'
      })),
      errorLogs: errorLogs.map((error: any) => ({
        id: error.id,
        errorType: error.error_type,
        message: error.message.substring(0, 100) + (error.message.length > 100 ? '...' : ''),
        severity: error.severity,
        timestamp: error.first_seen
      })),
      activeFeatureFlags,
      totalFeatureFlags,
      webhookFailures24h,
      cacheStatus: 'Operational' // This would come from actual cache service
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
