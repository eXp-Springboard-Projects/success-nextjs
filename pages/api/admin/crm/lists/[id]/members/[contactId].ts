import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, contactId } = req.query;
  const supabase = supabaseAdmin();

  if (typeof id !== 'string' || typeof contactId !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID or contact ID' });
  }

  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabase
        .from('list_members')
        .delete()
        .eq('listId', id)
        .eq('contactId', contactId);

      if (deleteError) throw deleteError;

      // Get current member count
      const { data: currentList } = await supabase
        .from('contact_lists')
        .select('memberCount')
        .eq('id', id)
        .single();

      // Update member count
      const { error: updateError } = await supabase
        .from('contact_lists')
        .update({
          memberCount: Math.max(0, (currentList?.memberCount || 1) - 1),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
