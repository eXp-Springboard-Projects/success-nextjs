/**
 * API Endpoint: /api/admin/refunds
 * Get all refunds and disputes with filtering
 * Note: Returns placeholder data until refund_disputes table is created
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Replace with actual database query when refund_disputes table is created
    // For now, return placeholder data to demonstrate the UI
    const placeholderRefunds = [
      {
        id: '1',
        ticketNumber: 'REF-2025-001',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        amount: 99.99,
        type: 'Refund',
        status: 'Pending',
        priority: 'High',
        requestDate: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Product not as described',
      },
      {
        id: '2',
        ticketNumber: 'CHG-2025-002',
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        amount: 149.50,
        type: 'Chargeback',
        status: 'UnderReview',
        priority: 'VIP',
        requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        reason: 'Unauthorized transaction',
      },
      {
        id: '3',
        ticketNumber: 'DIS-2025-003',
        customerName: 'Bob Johnson',
        customerEmail: 'bob.j@example.com',
        amount: 299.00,
        type: 'Dispute',
        status: 'Escalated',
        priority: 'High',
        requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        reason: 'Billing error',
      },
    ];

    const { status, type, search } = req.query;

    let filteredRefunds = [...placeholderRefunds];

    // Filter by status
    if (status && status !== 'all') {
      filteredRefunds = filteredRefunds.filter(
        r => r.status.toLowerCase() === status.toString().toLowerCase()
      );
    }

    // Filter by type
    if (type && type !== 'all') {
      filteredRefunds = filteredRefunds.filter(
        r => r.type.toLowerCase() === type.toString().toLowerCase()
      );
    }

    // Search filter
    if (search && search !== '') {
      const searchLower = search.toString().toLowerCase();
      filteredRefunds = filteredRefunds.filter(
        r =>
          r.ticketNumber.toLowerCase().includes(searchLower) ||
          r.customerName.toLowerCase().includes(searchLower) ||
          r.customerEmail.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json(filteredRefunds);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
