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

  // Only admins can view subscribers
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const {
        type,
        recipientType,
        isComplimentary,
        status,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const where: any = {};

      // Filter by subscription type
      if (type && type !== 'all') {
        where.type = type;
      }

      // Filter by recipient type
      if (recipientType && recipientType !== 'all') {
        where.recipientType = recipientType;
      }

      // Filter by complimentary status
      if (isComplimentary === 'true') {
        where.isComplimentary = true;
      } else if (isComplimentary === 'false') {
        where.isComplimentary = false;
      }

      // Filter by status
      if (status && status !== 'all') {
        where.status = status;
      }

      // Search by email or name
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [subscribers, total] = await Promise.all([
        prisma.subscribers.findMany({
          where,
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                membershipTier: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.subscribers.count({ where }),
      ]);

      return res.status(200).json({
        subscribers,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        email,
        firstName,
        lastName,
        type,
        recipientType,
        isComplimentary,
        source,
      } = req.body;

      // Check if subscriber already exists
      const existing = await prisma.subscribers.findUnique({
        where: { email },
      });

      if (existing) {
        return res.status(400).json({ message: 'Subscriber already exists' });
      }

      const subscriber = await prisma.subscribers.create({
        data: {
          email,
          firstName,
          lastName,
          type: type || 'EmailNewsletter',
          recipientType: recipientType || 'Customer',
          isComplimentary: isComplimentary || false,
          source: source || 'admin',
        },
      });

      return res.status(201).json(subscriber);
    } catch (error) {
      console.error('Error creating subscriber:', error);
      return res.status(500).json({ message: 'Failed to create subscriber' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
