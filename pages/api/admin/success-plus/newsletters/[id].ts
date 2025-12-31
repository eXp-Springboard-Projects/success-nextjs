import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Fetch newsletter details
      const { data: newsletter, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !newsletter) {
        return res.status(404).json({ error: 'Newsletter not found' });
      }

      // Fetch send statistics
      const { data: sends } = await supabase
        .from('newsletter_sends')
        .select('*')
        .eq('newsletterId', id);

      const stats = {
        totalSent: sends?.length || 0,
        opened: sends?.filter((s) => s.openedAt).length || 0,
        clicked: sends?.filter((s) => s.clickedAt).length || 0,
      };

      return res.status(200).json({
        newsletter,
        stats,
      });
    } catch (error) {
      console.error('Error fetching newsletter:', error);
      return res.status(500).json({ error: 'Failed to fetch newsletter' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('newsletters')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error updating newsletter:', error);
      return res.status(500).json({ error: 'Failed to update newsletter' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Only allow deleting drafts
      const { data: newsletter } = await supabase
        .from('newsletters')
        .select('status')
        .eq('id', id)
        .single();

      if (newsletter?.status !== 'draft') {
        return res.status(400).json({ error: 'Can only delete draft newsletters' });
      }

      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Newsletter deleted' });
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      return res.status(500).json({ error: 'Failed to delete newsletter' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
