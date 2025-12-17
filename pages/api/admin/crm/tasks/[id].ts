import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  if (req.method === 'GET') {
    return getTask(id, res);
  } else if (req.method === 'PATCH') {
    return updateTask(id, req, res, session);
  } else if (req.method === 'DELETE') {
    return deleteTask(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTask(id: string, res: NextApiResponse) {
  try {
    const task = await prisma.$queryRaw<Array<any>>`
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
      WHERE t.id = ${id}
    `;

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json(task[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    return res.status(500).json({ error: 'Failed to fetch task' });
  }
}

async function updateTask(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      title,
      description,
      type,
      priority,
      status,
      dueDate,
      dueTime,
      contactId,
      dealId,
      ticketId,
      assignedTo,
      assignedToName,
      reminderAt,
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      if (status === 'completed') {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
        updates.push(`completed_by = $${paramIndex}`);
        params.push(session.user.id);
        paramIndex++;
      }
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(dueDate);
      paramIndex++;
    }

    if (dueTime !== undefined) {
      updates.push(`due_time = $${paramIndex}`);
      params.push(dueTime);
      paramIndex++;
    }

    if (contactId !== undefined) {
      updates.push(`contact_id = $${paramIndex}`);
      params.push(contactId);
      paramIndex++;
    }

    if (dealId !== undefined) {
      updates.push(`deal_id = $${paramIndex}`);
      params.push(dealId);
      paramIndex++;
    }

    if (ticketId !== undefined) {
      updates.push(`ticket_id = $${paramIndex}`);
      params.push(ticketId);
      paramIndex++;
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(assignedTo);
      paramIndex++;
    }

    if (assignedToName !== undefined) {
      updates.push(`assigned_to_name = $${paramIndex}`);
      params.push(assignedToName);
      paramIndex++;
    }

    if (reminderAt !== undefined) {
      updates.push(`reminder_at = $${paramIndex}`);
      params.push(reminderAt);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    await prisma.$queryRawUnsafe(`
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    const task = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM tasks WHERE id = ${id}
    `;

    return res.status(200).json(task[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

async function deleteTask(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`DELETE FROM tasks WHERE id = ${id}`;
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}
