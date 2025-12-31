import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const logs: any[] = [];

    // Collect system information
    logs.push({
      timestamp: new Date().toISOString(),
      type: 'system_info',
      data: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
        vercel: process.env.VERCEL === '1',
        uptime: process.uptime()
      }
    });

    // Try to fetch error logs from database if table exists
    try {
      const supabase = supabaseAdmin();
      const { data: errorLogs, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error && errorLogs) {
        logs.push({
          timestamp: new Date().toISOString(),
          type: 'error_logs',
          data: errorLogs
        });
      }
    } catch (e) {
      // error_logs table may not exist
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: 'Error logs table not available'
      });
    }

    // Run health checks and include results
    try {
      const healthResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health/system-status`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        logs.push({
          timestamp: new Date().toISOString(),
          type: 'health_check',
          data: healthData
        });
      }
    } catch (e) {
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: 'Could not fetch health check data'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=system-logs-${new Date().toISOString().split('T')[0]}.json`);

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      exportedBy: session.user?.email,
      logs
    });
  } catch (error) {
    console.error('[Logs] Error exporting logs:', error);
    res.status(500).json({ message: 'Failed to export logs' });
  }
}
