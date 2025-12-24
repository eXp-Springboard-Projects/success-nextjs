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

  const { id } = req.query;
  const { note } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  if (!note) {
    return res.status(400).json({ error: 'Note is required' });
  }

  try {
    const supabase = supabaseAdmin();
    const noteId = nanoid();

    // Insert note
    const { data: createdNote, error: noteError } = await supabase
      .from('contact_notes')
      .insert({
        id: noteId,
        contact_id: id,
        staff_id: session.user.id,
        staff_name: session.user.name || session.user.email,
        note
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Log activity
    await supabase
      .from('contact_activities')
      .insert({
        id: nanoid(),
        contact_id: id,
        type: 'note_added',
        description: 'Staff note added'
      });

    return res.status(201).json(createdNote);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add note' });
  }
}
