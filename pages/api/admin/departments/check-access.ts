import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { Department } from '@prisma/client';
import { hasDepartmentAccess } from '@/lib/auth/departmentAccess';

/**
 * GET /api/admin/departments/check-access?department=EDITORIAL
 * Check if current user has access to a specific department
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { department } = req.query;

    if (!department || typeof department !== 'string') {
      return res.status(400).json({ error: 'department parameter required' });
    }

    const hasAccess = await hasDepartmentAccess(
      session.user.id,
      department as Department
    );

    return res.status(200).json({ hasAccess });

  } catch (error) {
    console.error('Check department access error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
