import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // TODO: Fetch DISC profile from database
    // For now, return sample data
    const discProfile = {
      dominance: 65,
      influence: 80,
      steadiness: 45,
      conscientiousness: 55,
      primaryType: 'I' as const,
      description: 'As an Influencer (I), you are enthusiastic, optimistic, and naturally collaborative. You excel at building relationships, inspiring others, and creating positive team environments. You thrive in social settings and enjoy working with people toward common goals.',
      strengths: [
        'Excellent communication and persuasion skills',
        'Natural ability to motivate and inspire others',
        'Optimistic outlook that energizes teams',
        'Strong relationship-building capabilities',
        'Creative problem-solving through collaboration'
      ],
      challenges: [
        'May struggle with detailed, analytical tasks',
        'Can be overly optimistic about timelines',
        'May need to focus more on follow-through',
        'Could benefit from more structure in planning',
        'May take criticism personally'
      ],
      completedAt: null, // Set to null if not completed, or a date string if completed
    };

    return res.status(200).json(discProfile);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
