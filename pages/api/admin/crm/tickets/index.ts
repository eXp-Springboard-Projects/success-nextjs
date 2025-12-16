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

  if (req.method === 'GET') {
    return getTickets(req, res);
  } else if (req.method === 'POST') {
    return createTicket(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTickets(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      status = '',
      priority = '',
      category = '',
      assignedTo = '',
      page = '1',
      limit = '50',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      whereClause += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (assignedTo) {
      whereClause += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    const tickets = await prisma.$queryRawUnsafe(`
      SELECT
        t.*,
        c.email as contact_email,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        (
          SELECT COUNT(*)
          FROM ticket_messages tm
          WHERE tm.ticket_id = t.id
        ) as message_count
      FROM tickets t
      LEFT JOIN crm_contacts c ON t.contact_id = c.id
      WHERE 1=1 ${whereClause}
      ORDER BY t.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, parseInt(limit as string), offset);

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM tickets t WHERE 1=1 ${whereClause}`,
      ...params
    );

    const total = Number(countResult[0].count);

    return res.status(200).json({
      tickets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}

async function createTicket(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { contactId, subject, description, priority = 'medium', category = 'general' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticketId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO tickets (
        id, contact_id, subject, description, priority, category, status
      ) VALUES (
        ${ticketId}, ${contactId || null}, ${subject}, ${description},
        ${priority}, ${category}, 'open'
      )
    `;

    // Get the created ticket with visible_id
    const ticket = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM tickets WHERE id = ${ticketId}
    `;

    // Create initial message
    await prisma.$executeRaw`
      INSERT INTO ticket_messages (
        id, ticket_id, sender_id, sender_type, message
      ) VALUES (
        ${nanoid()}, ${ticketId}, ${contactId || 'system'}, 'customer', ${description}
      )
    `;

    // Add activity to contact if contactId provided
    if (contactId) {
      await prisma.$executeRaw`
        INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
        VALUES (
          ${nanoid()}, ${contactId}, 'ticket_created',
          'Support ticket created: ${subject}',
          ${JSON.stringify({ ticketId })}::jsonb
        )
      `;
    }

    return res.status(201).json(ticket[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
}
