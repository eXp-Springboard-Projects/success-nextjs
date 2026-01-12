import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: list, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'List not found' });
        }
        throw error;
      }

      return res.status(200).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch list' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, description } = req.body;

      // Check if it's a system list
      const { data: existingList } = await supabase
        .from('contact_lists')
        .select('isSystem')
        .eq('id', id)
        .single();

      if (existingList?.isSystem) {
        return res.status(403).json({ error: 'Cannot edit system-managed lists' });
      }

      const { data: list, error } = await supabase
        .from('contact_lists')
        .update({
          name,
          description,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update list' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if it's a system list
      const { data: existingList } = await supabase
        .from('contact_lists')
        .select('isSystem, name')
        .eq('id', id)
        .single();

      if (existingList?.isSystem) {
        return res.status(403).json({ error: `Cannot delete system-managed list: ${existingList.name}` });
      }

      const { error } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete list' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
