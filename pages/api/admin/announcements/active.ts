import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Stub implementation - announcements model not yet in schema
    return res.status(200).json({ announcement: null });

  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
