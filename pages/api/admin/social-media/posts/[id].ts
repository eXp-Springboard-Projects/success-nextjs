import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'DELETE') {
    try {
      // Delete post (CASCADE will delete related results)
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', id as string)
        .eq('user_id', session.user.id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Get single post
      const { data: post, error } = await supabase
        .from('social_posts')
        .select('id, user_id, content, image_url, link_url, platforms, status, scheduled_at, posted_at, auto_generated, created_at')
        .eq('id', id as string)
        .eq('user_id', session.user.id)
        .single();

      if (error || !post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.status(200).json({ post });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
