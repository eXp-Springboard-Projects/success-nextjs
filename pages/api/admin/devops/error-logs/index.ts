import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch real error logs from system_alerts table
      const alerts = await prisma.$queryRaw<any[]>`
        SELECT
          id,
          "createdAt" as timestamp,
          CASE
            WHEN severity >= 4 THEN 'critical'
            WHEN severity = 3 THEN 'high'
            WHEN severity = 2 THEN 'medium'
            ELSE 'low'
          END as severity,
          message,
          title as page,
          metadata->>'userAgent' as "userAgent",
          "stackTrace" as stack
        FROM system_alerts
        WHERE type IN ('ERROR', 'CRITICAL')
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;

      type AlertRow = { id: string; timestamp: string; severity: string; message: string; page?: string; userAgent?: string; stack?: string };
      const logs = alerts.map((alert: AlertRow) => ({
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        message: alert.message,
        page: alert.page || 'Unknown',
        userAgent: alert.userAgent || 'Unknown',
        stack: alert.stack
      }));

      return res.status(200).json({ logs });
    } catch (error) {
      // Return empty array if query fails
      return res.status(200).json({ logs: [] });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
