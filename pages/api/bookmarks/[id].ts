import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid bookmark ID' });
  }

  // DELETE - Remove a bookmark
  if (req.method === 'DELETE') {
    try {
      // Check if bookmark exists and belongs to user
      const bookmark = await prisma.bookmarks.findUnique({
        where: { id },
      });

      if (!bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }

      if (bookmark.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await prisma.bookmarks.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Bookmark deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete bookmark' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
