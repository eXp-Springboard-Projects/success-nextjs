import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  try {
    if (req.method === 'GET') {
      const template = await prisma.email_templates.findUnique({
        where: { id },
        include: {
          campaigns: true,
        },
      });

      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      return res.status(200).json(template);
    }

    if (req.method === 'PUT') {
      const { name, subject, content, blocks, isDefault } = req.body;

      // If this is set as default, unset all other defaults
      if (isDefault) {
        await prisma.email_templates.updateMany({
          where: {
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false },
        });
      }

      const template = await prisma.email_templates.update({
        where: { id },
        data: {
          name: name || undefined,
          subject: subject || undefined,
          content: content || undefined,
          blocks: blocks !== undefined ? blocks : undefined,
          isDefault: isDefault !== undefined ? isDefault : undefined,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(template);
    }

    if (req.method === 'DELETE') {
      // Check if template is in use
      const template = await prisma.email_templates.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
      });

      if (template && template._count.campaigns > 0) {
        return res.status(400).json({
          message: `Cannot delete template. It is currently used in ${template._count.campaigns} campaign(s).`
        });
      }

      await prisma.email_templates.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Template deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in template API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
