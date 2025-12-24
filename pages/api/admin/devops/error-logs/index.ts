import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch real error logs from system_alerts table
      const { data: alerts, error } = await supabase
        .from('system_alerts')
        .select('id, createdAt, severity, message, title, metadata, stackTrace')
        .in('type', ['ERROR', 'CRITICAL'])
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      const logs = (alerts || []).map((alert: any) => {
        let severityLevel = 'low';
        if (alert.severity >= 4) severityLevel = 'critical';
        else if (alert.severity === 3) severityLevel = 'high';
        else if (alert.severity === 2) severityLevel = 'medium';

        return {
          id: alert.id,
          timestamp: alert.createdAt,
          severity: severityLevel,
          message: alert.message,
          page: alert.title || 'Unknown',
          userAgent: alert.metadata?.userAgent || 'Unknown',
          stack: alert.stackTrace
        };
      });

      return res.status(200).json({ logs });
    } catch (error) {
      // Return empty array if query fails
      return res.status(200).json({ logs: [] });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
