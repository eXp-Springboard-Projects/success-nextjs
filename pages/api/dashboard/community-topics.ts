import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // TODO: Fetch community topics from database
    // For now, return sample data
    const topics = [
      {
        id: '1',
        title: '2025 Goal Setting - Share Your Big Goals!',
        category: 'Accountability',
        author: 'Sarah Mitchell',
        authorAvatar: 'https://i.pravatar.cc/150?img=5',
        replies: 47,
        views: 523,
        lastActivity: '2 hours ago',
        isPinned: true,
      },
      {
        id: '2',
        title: 'Just closed my first 6-figure deal!',
        category: 'Success Stories',
        author: 'Marcus Johnson',
        authorAvatar: 'https://i.pravatar.cc/150?img=12',
        replies: 89,
        views: 1245,
        lastActivity: '4 hours ago',
        isPinned: false,
      },
      {
        id: '3',
        title: 'Best productivity tools for entrepreneurs?',
        category: 'Q&A',
        author: 'Jennifer Lee',
        authorAvatar: 'https://i.pravatar.cc/150?img=9',
        replies: 34,
        views: 412,
        lastActivity: '1 day ago',
        isPinned: false,
      },
      {
        id: '4',
        title: 'Monthly Accountability Check-In - December',
        category: 'Accountability',
        author: 'David Chen',
        authorAvatar: 'https://i.pravatar.cc/150?img=15',
        replies: 102,
        views: 876,
        lastActivity: '5 hours ago',
        isPinned: true,
      },
      {
        id: '5',
        title: 'Networking in the digital age - tips?',
        category: 'Networking',
        author: 'Amanda Rodriguez',
        authorAvatar: 'https://i.pravatar.cc/150?img=22',
        replies: 56,
        views: 634,
        lastActivity: '3 days ago',
        isPinned: false,
      },
    ];

    return res.status(200).json(topics);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
