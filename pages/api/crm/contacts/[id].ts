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
    return res.status(400).json({ message: 'Invalid contact ID' });
  }

  try {
    if (req.method === 'GET') {
      const contact = await prisma.contacts.findUnique({
        where: { id },
        include: {
          email_logs: {
            orderBy: { sentAt: 'desc' },
            take: 10,
          },
          campaign_contacts: {
            include: {
              campaigns: true,
            },
          },
        },
      });

      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      return res.status(200).json(contact);
    }

    if (req.method === 'PUT') {
      const { email, firstName, lastName, phone, company, tags, status, notes } = req.body;

      const contact = await prisma.contacts.update({
        where: { id },
        data: {
          email: email || undefined,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          company: company || null,
          tags: tags || undefined,
          status: status || undefined,
          notes: notes || null,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(contact);
    }

    if (req.method === 'DELETE') {
      await prisma.contacts.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Contact deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in contact API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
