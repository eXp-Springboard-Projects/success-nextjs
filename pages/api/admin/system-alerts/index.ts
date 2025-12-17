import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins can view system alerts
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const { resolved, category, severity, limit = 50 } = req.query;

      const where: any = {};

      if (resolved === 'false') {
        where.isResolved = false;
      } else if (resolved === 'true') {
        where.isResolved = true;
      }

      if (category) {
        where.category = category;
      }

      if (severity) {
        where.severity = parseInt(severity as string);
      }

      const alerts = await prisma.system_alerts.findMany({
        where,
        orderBy: [
          { isResolved: 'asc' }, // Unresolved first
          { severity: 'desc' }, // Highest severity first
          { createdAt: 'desc' },
        ],
        take: parseInt(limit as string),
      });

      return res.status(200).json(alerts);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return res.status(500).json({ message: 'Failed to fetch system alerts' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
