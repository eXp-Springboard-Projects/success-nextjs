import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';
import { auditLog } from '../../../../../lib/audit-middleware';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.query;

  try {
    const alert = await prisma.system_alerts.update({
      where: { id: id as string },
      data: {
        isResolved: true,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
      },
    });

    // Audit log
    await auditLog(
      {
        userId: session.user.id,
        userEmail: session.user.email || '',
        userName: session.user.name || '',
        action: 'system_alert.resolved',
        entityType: 'SystemAlert',
        entityId: alert.id,
        metadata: {
          alertType: alert.type,
          alertCategory: alert.category,
          severity: alert.severity,
        },
      },
      req
    );

    return res.status(200).json(alert);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve alert' });
  }
}
