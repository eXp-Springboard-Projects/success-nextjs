import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check for secret to confirm this is a valid request
  const secret = req.query.secret as string;
  const expectedSecret = process.env.REVALIDATE_SECRET || 'dev-secret-change-in-production';

  if (secret !== expectedSecret) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // Get the path to revalidate from query params
    const path = req.query.path as string;

    if (path) {
      // Revalidate specific path
      await res.revalidate(path);
      return res.json({ revalidated: true, path });
    }

    // Revalidate common paths
    const pathsToRevalidate = [
      '/',
      '/blog',
      '/magazine',
      '/subscribe'
    ];

    await Promise.all(pathsToRevalidate.map(p => res.revalidate(p)));

    return res.json({
      revalidated: true,
      paths: pathsToRevalidate,
      message: 'Common pages revalidated successfully'
    });
  } catch (err) {
    console.error('[Revalidate] Error:', err);
    return res.status(500).json({ message: 'Error revalidating', error: err });
  }
}
