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
    return getTasks(req, res, session);
  } else if (req.method === 'POST') {
    return createTask(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTasks(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      filter = 'my',
      type = '',
      priority = '',
      contactId = '',
      dealId = '',
      ticketId = '',
    } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by user
    if (filter === 'my') {
      whereClause += ` AND t.assigned_to = $${paramIndex}`;
      params.push(session.user.id);
      paramIndex++;
    } else if (filter === 'overdue') {
      whereClause += ` AND t.status = 'pending' AND t.due_date < CURRENT_DATE`;
    } else if (filter === 'completed') {
      whereClause += ` AND t.status = 'completed'`;
    }

    if (type) {
      whereClause += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (priority) {
      whereClause += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (contactId) {
      whereClause += ` AND t.contact_id = $${paramIndex}`;
      params.push(contactId);
      paramIndex++;
    }

    if (dealId) {
      whereClause += ` AND t.deal_id = $${paramIndex}`;
      params.push(dealId);
      paramIndex++;
    }

    if (ticketId) {
      whereClause += ` AND t.ticket_id = $${paramIndex}`;
      params.push(ticketId);
      paramIndex++;
    }

    const tasks = await prisma.$queryRawUnsafe(`
      SELECT
        t.*,
        c.email as contact_email,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        d.name as deal_name,
        tk.subject as ticket_subject
      FROM tasks t
      LEFT JOIN contacts c ON t.contact_id = c.id
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN tickets tk ON t.ticket_id = tk.id
      WHERE 1=1 ${whereClause}
      ORDER BY
        CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.priority DESC,
        t.created_at DESC
    `, ...params);

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

async function createTask(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      title,
      description,
      type = 'todo',
      priority = 'medium',
      dueDate,
      dueTime,
      contactId,
      dealId,
      ticketId,
      assignedTo,
      assignedToName,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO tasks (
        id, title, description, type, priority, due_date, due_time,
        contact_id, deal_id, ticket_id, assigned_to, assigned_to_name, created_by
      ) VALUES (
        ${taskId}, ${title}, ${description || null}, ${type}, ${priority},
        ${dueDate || null}, ${dueTime || null}, ${contactId || null},
        ${dealId || null}, ${ticketId || null},
        ${assignedTo || session.user.id}, ${assignedToName || session.user.name},
        ${session.user.id}
      )
    `;

    const task = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM tasks WHERE id = ${taskId}
    `;

    return res.status(201).json(task[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}
