import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Department } from '@prisma/client';

/**
 * POST /api/admin/departments/assign
 * Assign a user to one or more departments (Super Admin only)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is Super Admin
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admins can assign departments' });
    }

    const { userId, departments } = req.body as {
      userId: string;
      departments: Department[];
    };

    if (!userId || !Array.isArray(departments)) {
      return res.status(400).json({ error: 'userId and departments array required' });
    }

    // Verify target user exists
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove all existing department assignments for this user
    await prisma.staff_departments.deleteMany({
      where: { userId },
    });

    // Create new department assignments
    if (departments.length > 0) {
      await prisma.staff_departments.createMany({
        data: departments.map(department => ({
          userId,
          department,
          assignedBy: session.user.id,
        })),
      });
    }

    // Log the action
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'ASSIGN_DEPARTMENTS',
        entity: 'staff_departments',
        entityId: userId,
        details: JSON.stringify({
          targetUser: targetUser.email,
          departments,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Assigned ${departments.length} department(s) to ${targetUser.name}`,
    });

  } catch (error) {
    console.error('Department assignment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
