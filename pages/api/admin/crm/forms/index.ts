import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status && status !== 'all') {
        where.status = status as string;
      }

      const forms = await prisma.forms.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ forms });
    } catch (error) {
      console.error('Error fetching forms:', error);
      return res.status(500).json({ error: 'Failed to fetch forms' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, fields, settings, thankYouMessage, redirectUrl, listId, tags, notifyEmails, status } = req.body;

      const form = await prisma.forms.create({
        data: {
          id: uuidv4(),
          name,
          fields: fields || [],
          settings: settings || {},
          thankYouMessage,
          redirectUrl,
          listId,
          tags: tags || [],
          notifyEmails: notifyEmails || [],
          status: status || 'draft',
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(form);
    } catch (error) {
      console.error('Error creating form:', error);
      return res.status(500).json({ error: 'Failed to create form' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
