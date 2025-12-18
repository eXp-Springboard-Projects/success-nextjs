import { NextApiRequest, NextApiResponse } from 'next';
import { recalculateAllScores } from '@/lib/crm/leadScoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await recalculateAllScores();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to recalculate scores' });
  }
}
