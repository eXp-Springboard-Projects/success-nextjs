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

    const { id } = req.query;

    if (req.method === 'GET') {
      // Return stub dispute data
      return res.status(200).json({
        dispute: {
          id: id as string,
          customerName: 'Unknown',
          customerEmail: 'unknown@example.com',
          amount: 0,
          reason: 'Unknown',
          status: 'pending',
          createdAt: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          chargeId: '',
          notes: '',
          stripeDisputeId: '',
          statusHistory: [],
        },
      });
    }

    if (req.method === 'PATCH') {
      const { status, notes } = req.body;

      // Return stub updated dispute
      return res.status(200).json({
        dispute: {
          id: id as string,
          status: status || 'pending',
          notes: notes || '',
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
