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
    const supabase = supabaseAdmin();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        contact:crm_contacts(id, email, first_name, last_name, phone, company)
      `)
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get messages
    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    return res.status(200).json({
      ...ticket,
      contact_id: ticket.contact?.id,
      contact_email: ticket.contact?.email,
      contact_first_name: ticket.contact?.first_name,
      contact_last_name: ticket.contact?.last_name,
      contact_phone: ticket.contact?.phone,
      contact_company: ticket.contact?.company,
      contact: undefined,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
}

async function updateTicket(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const { status, priority, category, assignedTo } = req.body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { data: ticket, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update ticket' });
      }

      // Add internal note about the change
      const changes = [];
      if (status) changes.push(`Status: ${status}`);
      if (priority) changes.push(`Priority: ${priority}`);
      if (category) changes.push(`Category: ${category}`);
      if (assignedTo) changes.push(`Assigned to: ${assignedTo}`);

      if (changes.length > 0) {
        await supabase
          .from('ticket_messages')
          .insert({
            id: nanoid(),
            ticket_id: id,
            sender_id: session.user.id,
            sender_type: 'staff',
            message: 'Ticket updated: ' + changes.join(', '),
            is_internal: true,
          });
      }

      return res.status(200).json(ticket);
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
}
