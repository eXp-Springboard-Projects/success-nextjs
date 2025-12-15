import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        per_page = '100',
        search = '',
      } = req.query;

      const pageNum = parseInt(page as string);
      const perPage = parseInt(per_page as string);
      const skip = (pageNum - 1) * perPage;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { filename: { contains: search as string, mode: 'insensitive' } },
          { alt: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Fetch media
      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: perPage,
        }),
        prisma.media.count({ where })
      ]);

      // Add pagination headers
      res.setHeader('X-Total', total.toString());
      res.setHeader('X-Total-Pages', Math.ceil(total / perPage).toString());

      return res.status(200).json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
