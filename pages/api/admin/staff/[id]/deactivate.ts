import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only super admins can deactivate staff accounts
    if (session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admins can deactivate staff accounts' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { reason } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    // Prevent self-deactivation
    if (id === session.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    // Get staff member
    const staffMember = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (!staffMember.isActive) {
      return res.status(400).json({ error: 'Staff member is already deactivated' });
    }

    // Deactivate the account
    await prisma.users.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        action: 'STAFF_DEACTIVATED',
        entity: 'users',
        entityId: staffMember.id,
        details: `Deactivated account for ${staffMember.name} (${staffMember.email})${reason ? `. Reason: ${reason}` : ''}`,
        createdAt: new Date(),
      },
    });

    return res.status(200).json({
      message: 'Staff account deactivated successfully',
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Deactivate staff API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
