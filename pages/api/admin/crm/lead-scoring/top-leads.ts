import { NextApiRequest, NextApiResponse } from 'next';
import { getTopLeads } from '@/lib/crm/leadScoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leads = await getTopLeads(limit);

    return res.status(200).json({ leads });
  } catch (error) {
    console.error('Error fetching top leads:', error);
    return res.status(500).json({ error: 'Failed to fetch top leads' });
  }
}
