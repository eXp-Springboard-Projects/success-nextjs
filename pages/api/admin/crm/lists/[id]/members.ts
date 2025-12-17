import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', perPage = '20', search = '', export: exportCsv } = req.query;
      const pageNum = parseInt(page as string, 10);
      const perPageNum = parseInt(perPage as string, 10);
      const skip = (pageNum - 1) * perPageNum;

      const where: any = {
        listId: id,
      };

      if (search) {
        where.contact = {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' } },
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
          ],
        };
      }

      const [members, total] = await Promise.all([
        prisma.list_members.findMany({
          where,
          include: {
            contact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
          },
          skip: exportCsv ? undefined : skip,
          take: exportCsv ? undefined : perPageNum,
          orderBy: { addedAt: 'desc' },
        }),
        prisma.list_members.count({ where }),
      ]);

      // Export CSV
      if (exportCsv) {
        const csv = [
          'Email,First Name,Last Name,Status,Added Date',
          ...members.map((m) => {
            const contact = m.contact;
            return `${contact.email},${contact.firstName || ''},${contact.lastName || ''},${contact.status},${new Date(m.addedAt).toISOString()}`;
          }),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
        return res.status(200).send(csv);
      }

      const formattedMembers = members.map((m) => ({
        id: m.contact.id,
        email: m.contact.email,
        firstName: m.contact.firstName,
        lastName: m.contact.lastName,
        status: m.contact.status,
        addedAt: m.addedAt,
      }));

      return res.status(200).json({
        members: formattedMembers,
        total,
        page: pageNum,
        perPage: perPageNum,
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find contact by email
      const contact = await prisma.contacts.findUnique({
        where: { email },
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Check if already in list
      const existing = await prisma.list_members.findFirst({
        where: {
          listId: id,
          contactId: contact.id,
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Contact already in list' });
      }

      // Add to list
      await prisma.list_members.create({
        data: {
          id: uuidv4(),
          listId: id,
          contactId: contact.id,
        },
      });

      // Update member count
      await prisma.contact_lists.update({
        where: { id },
        data: {
          memberCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error adding member:', error);
      return res.status(500).json({ error: 'Failed to add member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
