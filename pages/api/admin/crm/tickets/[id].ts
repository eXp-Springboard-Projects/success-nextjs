import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket ID' });
  }

  if (req.method === 'GET') {
    return getTicket(id, res);
  } else if (req.method === 'PATCH') {
    return updateTicket(id, req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTicket(id: string, res: NextApiResponse) {
  try {
    const ticket = await prisma.$queryRaw<Array<any>>`
      SELECT
        t.*,
        c.id as contact_id,
        c.email as contact_email,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.phone as contact_phone,
        c.company as contact_company
      FROM tickets t
      LEFT JOIN crm_contacts c ON t.contact_id = c.id
      WHERE t.id = ${id}
    `;

    if (ticket.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get messages
    const messages = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM ticket_messages
      WHERE ticket_id = ${id}
      ORDER BY created_at ASC
    `;

    return res.status(200).json({
      ...ticket[0],
      messages,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
}

async function updateTicket(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { status, priority, category, assignedTo } = req.body;

    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      if (status === 'resolved') {
        updates.push(`resolved_at = CURRENT_TIMESTAMP`);
      }
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(assignedTo);
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      await prisma.$queryRawUnsafe(
        `UPDATE tickets SET ${updates.join(', ')} WHERE id = $1`,
        ...params
      );

      // Add internal note about the change
      const changes = [];
      if (status) changes.push(`Status: ${status}`);
      if (priority) changes.push(`Priority: ${priority}`);
      if (category) changes.push(`Category: ${category}`);
      if (assignedTo) changes.push(`Assigned to: ${assignedTo}`);

      if (changes.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO ticket_messages (
            id, ticket_id, sender_id, sender_type, message, is_internal
          ) VALUES (
            ${nanoid()}, ${id}, ${session.user.id}, 'staff',
            ${'Ticket updated: ' + changes.join(', ')}, true
          )
        `;
      }
    }

    const ticket = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM tickets WHERE id = ${id}
    `;

    return res.status(200).json(ticket[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
}
