import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';

// Note: This endpoint is a placeholder - tickets model is not yet implemented
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return empty data until tickets feature is implemented
  return res.status(200).json({
    ticketsOverTime: [],
    resolutionTimeOverTime: [],
    ticketsByCategory: [],
    avgResolutionTime: 0,
    totalTickets: 0,
    message: 'Tickets feature not yet implemented',
  });
}
