import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

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
    const supabase = supabaseAdmin();
    const {
      filter = 'my',
      type = '',
      priority = '',
      contactId = '',
      dealId = '',
      ticketId = '',
    } = req.query;

    let query = supabase
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
      `);

    // Filter by user
    if (filter === 'my') {
      query = query.eq('assigned_to', session.user.id);
    } else if (filter === 'overdue') {
      query = query.eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
    } else if (filter === 'today') {
      query = query.eq('status', 'pending').eq('due_date', new Date().toISOString().split('T')[0]);
    } else if (filter === 'upcoming') {
      query = query.eq('status', 'pending').gt('due_date', new Date().toISOString().split('T')[0]);
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed');
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }

    query = query.order('status', { ascending: true, nullsFirst: false })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }

    // Transform the data to match the expected format
    const transformedTasks = tasks?.map(task => ({
      ...task,
      contact_email: task.contacts?.email,
      contact_first_name: task.contacts?.first_name,
      contact_last_name: task.contacts?.last_name,
      deal_name: task.deals?.name,
      ticket_subject: task.tickets?.subject,
    }));

    return res.status(200).json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

async function createTask(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
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
      reminderAt,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = nanoid();

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        title,
        description: description || null,
        type,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
        ticket_id: ticketId || null,
        assigned_to: assignedTo || session.user.id,
        assigned_to_name: assignedToName || session.user.name,
        reminder_at: reminderAt || null,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}
