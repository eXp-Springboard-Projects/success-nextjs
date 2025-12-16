import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const form = await prisma.forms.findUnique({
        where: { id: id as string },
        include: {
          list: true,
        },
      });

      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      return res.status(200).json(form);
    } catch (error) {
      console.error('Error fetching form:', error);
      return res.status(500).json({ error: 'Failed to fetch form' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, fields, settings, thankYouMessage, redirectUrl, listId, tags, notifyEmails, status } = req.body;

      const form = await prisma.forms.update({
        where: { id: id as string },
        data: {
          ...(name !== undefined && { name }),
          ...(fields !== undefined && { fields }),
          ...(settings !== undefined && { settings }),
          ...(thankYouMessage !== undefined && { thankYouMessage }),
          ...(redirectUrl !== undefined && { redirectUrl }),
          ...(listId !== undefined && { listId }),
          ...(tags !== undefined && { tags }),
          ...(notifyEmails !== undefined && { notifyEmails }),
          ...(status !== undefined && { status }),
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(form);
    } catch (error) {
      console.error('Error updating form:', error);
      return res.status(500).json({ error: 'Failed to update form' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.forms.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting form:', error);
      return res.status(500).json({ error: 'Failed to delete form' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
