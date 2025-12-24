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
    return getTickets(req, res);
  } else if (req.method === 'POST') {
    return createTicket(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTickets(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const query = req.query;
    const status = (query.status as string) || '';
    const priority = (query.priority as string) || '';
    const category = (query.category as string) || '';
    const assignedTo = (query.assignedTo as string) || '';
    const page = parseInt((query.page as string) || '1');
    const limit = parseInt((query.limit as string) || '50');
    const sortBy = (query.sortBy as string) || 'created_at';
    const sortOrder = (query.sortOrder as string) || 'desc';
    const offset = (page - 1) * limit;

    let ticketsQuery = supabase
      .from('tickets')
      .select(`
        *,
        contact:crm_contacts(email, first_name, last_name)
      `, { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) ticketsQuery = ticketsQuery.eq('status', status);
    if (priority) ticketsQuery = ticketsQuery.eq('priority', priority);
    if (category) ticketsQuery = ticketsQuery.eq('category', category);
    if (assignedTo) ticketsQuery = ticketsQuery.eq('assigned_to', assignedTo);

    const { data: tickets, error, count } = await ticketsQuery;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    // Get message counts for each ticket
    const ticketsWithMessageCount = await Promise.all(
      (tickets || []).map(async (ticket) => {
        const { count: messageCount } = await supabase
          .from('ticket_messages')
          .select('id', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id);

        return {
          ...ticket,
          contact_email: ticket.contact?.email,
          contact_first_name: ticket.contact?.first_name,
          contact_last_name: ticket.contact?.last_name,
          contact: undefined,
          message_count: messageCount || 0,
        };
      })
    );

    return res.status(200).json({
      tickets: ticketsWithMessageCount,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}

async function createTicket(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const { contactId, subject, description, priority = 'medium', category = 'general' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticketId = nanoid();

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        contact_id: contactId || null,
        subject,
        description,
        priority,
        category,
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) {
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    // Create initial message
    await supabase
      .from('ticket_messages')
      .insert({
        id: nanoid(),
        ticket_id: ticketId,
        sender_id: contactId || 'system',
        sender_type: 'customer',
        message: description,
      });

    // Add activity to contact if contactId provided
    if (contactId) {
      await supabase
        .from('crm_contact_activities')
        .insert({
          id: nanoid(),
          contact_id: contactId,
          type: 'ticket_created',
          description: `Support ticket created: ${subject}`,
          metadata: { ticketId },
        });
    }

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
}
