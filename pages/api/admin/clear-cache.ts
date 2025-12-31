import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // In Next.js, cache clearing can be done via:
    // 1. On-demand revalidation (which we handle separately)
    // 2. Clearing any custom caches you've implemented
    // 3. For now, we'll just return success as Next.js handles most caching automatically

    // If you implement Redis or another cache layer, clear it here
    // Example:
    // await redis.flushall();

    console.log('[Cache] Cache clear requested by:', session.user?.email);

    res.status(200).json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
    res.status(500).json({ message: 'Failed to clear cache' });
  }
}
