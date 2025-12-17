import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const templates = await prisma.email_templates.findMany({
        include: {
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(templates);
    }

    if (req.method === 'POST') {
      const { name, subject, content, blocks, isDefault } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ message: 'Name and subject are required' });
      }

      // If this is set as default, unset all other defaults
      if (isDefault) {
        await prisma.email_templates.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await prisma.email_templates.create({
        data: {
          id: randomUUID(),
          name,
          subject,
          content: content || '',
          isDefault: isDefault || false,
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(template);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in templates API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
