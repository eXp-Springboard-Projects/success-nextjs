import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can approve staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    // Default to EDITOR role if not specified
    const { role = 'EDITOR', department } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate department
    const validDepartments = [
      'SUPER_ADMIN',
      'CUSTOMER_SERVICE',
      'EDITORIAL',
      'SUCCESS_PLUS',
      'DEV',
      'MARKETING',
      'COACHING',
    ];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: 'Invalid department' });
    }

    // Check if user exists and is pending
    const user = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role FROM users WHERE id = ${id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user[0].role !== 'PENDING') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Update user role and department
    await prisma.$executeRaw`
      UPDATE users
      SET
        role = ${role}::"UserRole",
        primary_department = ${department}::"Department",
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // TODO: Send approval email to user

    return res.status(200).json({ message: 'User approved successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve user' });
  }
}
