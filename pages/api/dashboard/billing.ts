import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // TODO: Fetch billing data from database/Stripe
    // For now, return sample data
    const billingData = {
      subscription: {
        tier: 'Insider',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false,
        amount: 49.97,
        interval: 'month',
      },
      orders: [
        {
          id: 'inv_001',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          description: 'SUCCESS+ Insider Monthly',
          amount: 49.97,
          status: 'paid',
          invoiceUrl: 'https://mysuccessplus.com/invoices/inv_001',
        },
        {
          id: 'inv_002',
          date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
          description: 'SUCCESS+ Insider Monthly',
          amount: 49.97,
          status: 'paid',
          invoiceUrl: 'https://mysuccessplus.com/invoices/inv_002',
        },
        {
          id: 'inv_003',
          date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(), // 65 days ago
          description: 'SUCCESS+ Insider Monthly',
          amount: 49.97,
          status: 'paid',
          invoiceUrl: 'https://mysuccessplus.com/invoices/inv_003',
        },
      ],
    };

    return res.status(200).json(billingData);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
