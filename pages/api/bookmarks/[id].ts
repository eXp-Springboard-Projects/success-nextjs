import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid bookmark ID' });
  }

  // DELETE - Remove a bookmark
  if (req.method === 'DELETE') {
    try {
      // Check if bookmark exists and belongs to user
      const { data: bookmark, error: fetchError } = await supabase
        .from('bookmarks')
        .select('userId')
        .eq('id', id)
        .single();

      if (fetchError || !bookmark) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }

      if (bookmark.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({ message: 'Bookmark deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete bookmark' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
