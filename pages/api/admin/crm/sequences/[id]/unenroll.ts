import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    const { error } = await supabase
      .from('sequence_enrollments')
      .update({
        status: 'unenrolled',
        updated_at: new Date().toISOString(),
      })
      .eq('sequence_id', id)
      .eq('contact_id', contactId)
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Contact unenrolled successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unenroll contact' });
  }
}
