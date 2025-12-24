import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const { id } = req.query;
    const { message, isInternal = false } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messageId = nanoid();

    const { data: createdMessage, error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        id: messageId,
        ticket_id: id,
        sender_id: session.user.id,
        sender_type: 'staff',
        message,
        is_internal: isInternal,
      })
      .select()
      .single();

    if (messageError) {
      return res.status(500).json({ error: 'Failed to add message' });
    }

    // Update ticket updated_at
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return res.status(201).json(createdMessage);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add message' });
  }
}
