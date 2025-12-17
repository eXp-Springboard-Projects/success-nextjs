/**
 * API Endpoint: /api/admin/staff/[id]
 * Methods: GET, PUT, DELETE
 * Description: Manage individual staff member
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN and ADMIN can manage staff
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid staff ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getStaffMember(id, res);
      case 'PUT':
        return await updateStaffMember(id, req, res, session);
      case 'DELETE':
        return await deactivateStaffMember(id, res, session);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Staff API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getStaffMember(id: string, res: NextApiResponse) {
  const user = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      bio: true,
      avatar: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Get departments
  const departments = await prisma.staff_departments.findMany({
    where: { userId: id },
    select: { department: true },
  });

  return res.status(200).json({
    ...user,
    postsCount: user._count.posts,
    departments: departments.map((d: { department: string }) => d.department),
  });
}

async function updateStaffMember(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  const { name, email, role, bio, avatar } = req.body;

  // Validate required fields
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  // Only SUPER_ADMIN can change roles to/from SUPER_ADMIN
  const currentUser = await prisma.users.findUnique({
    where: { id },
    select: { role: true },
  });

  if (
    (currentUser?.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') &&
    session.user.role !== 'SUPER_ADMIN'
  ) {
    return res.status(403).json({
      error: 'Only Super Admins can modify Super Admin roles',
    });
  }

  // Update user
  const updatedUser = await prisma.users.update({
    where: { id },
    data: {
      name,
      email,
      role,
      bio: bio || null,
      avatar: avatar || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatar: true,
    },
  });

  return res.status(200).json({
    message: 'Staff member updated successfully',
    user: updatedUser,
  });
}

async function deactivateStaffMember(
  id: string,
  res: NextApiResponse,
  session: any
) {
  // Check if trying to deactivate a SUPER_ADMIN
  const user = await prisma.users.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Only Super Admins can deactivate Super Admin accounts',
    });
  }

  // Prevent self-deactivation
  if (id === session.user.id) {
    return res.status(400).json({
      error: 'Cannot deactivate your own account',
    });
  }

  // Deactivate by setting emailVerified to false
  await prisma.users.update({
    where: { id },
    data: {
      emailVerified: false,
    },
  });

  return res.status(200).json({
    message: 'Staff member deactivated successfully',
  });
}
