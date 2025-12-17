import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const subscriber = await prisma.subscribers.findUnique({
        where: { id: id as string },
        include: {
          member: true,
        },
      });

      if (!subscriber) {
        return res.status(404).json({ message: 'Subscriber not found' });
      }

      return res.status(200).json(subscriber);
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      return res.status(500).json({ message: 'Failed to fetch subscriber' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        email,
        firstName,
        lastName,
        type,
        recipientType,
        isComplimentary,
        status,
      } = req.body;

      const subscriber = await prisma.subscribers.update({
        where: { id: id as string },
        data: {
          email,
          firstName,
          lastName,
          type,
          recipientType,
          isComplimentary,
          status,
          ...(status === 'UNSUBSCRIBED' && { unsubscribedAt: new Date() }),
        },
      });

      return res.status(200).json(subscriber);
    } catch (error) {
      console.error('Error updating subscriber:', error);
      return res.status(500).json({ message: 'Failed to update subscriber' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.subscribers.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ message: 'Subscriber deleted' });
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      return res.status(500).json({ message: 'Failed to delete subscriber' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
