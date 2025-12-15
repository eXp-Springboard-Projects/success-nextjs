import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'CUSTOMER_SERVICE')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Return stub data
      const response = {
        disputes: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
        },
      };

      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const { customerEmail, chargeId, amount, reason, notes } = req.body;

      if (!customerEmail || !chargeId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Return stub created dispute
      const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return res.status(201).json({
        dispute: {
          id: disputeId,
          amount: parseFloat(amount),
          reason: reason || 'general',
          status: 'needs_response',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling disputes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
