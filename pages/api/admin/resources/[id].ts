import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'PUT') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error updating resource:', error);
      return res.status(500).json({ message: 'Failed to update resource' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ message: 'Resource deleted' });
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      return res.status(500).json({ message: 'Failed to delete resource' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
