import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

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
    const supabase = supabaseAdmin();

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        contacts!tasks_contact_id_fkey (
          email,
          first_name,
          last_name
        ),
        deals!tasks_deal_id_fkey (
          name
        ),
        tickets!tasks_ticket_id_fkey (
          subject
        )
      `)
      .eq('id', id)
      .single();

    if (error || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Transform the data to match the expected format
    const transformedTask = {
      ...task,
      contact_email: task.contacts?.email,
      contact_first_name: task.contacts?.first_name,
      contact_last_name: task.contacts?.last_name,
      deal_name: task.deals?.name,
      ticket_subject: task.tickets?.subject,
    };

    return res.status(200).json(transformedTask);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return res.status(500).json({ error: 'Failed to fetch task' });
  }
}

async function updateTask(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
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

    const updates: any = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = session.user.id;
      }
    }
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (dueTime !== undefined) updates.due_time = dueTime;
    if (contactId !== undefined) updates.contact_id = contactId;
    if (dealId !== undefined) updates.deal_id = dealId;
    if (ticketId !== undefined) updates.ticket_id = ticketId;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    if (assignedToName !== undefined) updates.assigned_to_name = assignedToName;
    if (reminderAt !== undefined) updates.reminder_at = reminderAt;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update task:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

async function deleteTask(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete task:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}
