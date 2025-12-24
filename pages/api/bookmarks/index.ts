import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

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

  // GET - Fetch user's bookmarks
  if (req.method === 'GET') {
    try {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json(bookmarks || []);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  }

  // POST - Create a new bookmark
  if (req.method === 'POST') {
    try {
      const { articleId, articleTitle, articleUrl, articleImage } = req.body;

      if (!articleId || !articleTitle || !articleUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if bookmark already exists
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('userId', userId)
        .eq('articleId', articleId)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Bookmark already exists' });
      }

      const { data: bookmark, error } = await supabase
        .from('bookmarks')
        .insert({
          id: randomUUID(),
          userId,
          articleId,
          articleTitle,
          articleUrl,
          articleImage: articleImage || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create activity log
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert({
          id: randomUUID(),
          userId,
          activityType: 'ARTICLE_BOOKMARKED',
          title: `Bookmarked: ${articleTitle}`,
          metadata: JSON.stringify({ articleId, articleUrl }),
        });

      if (activityError) {
        console.error('Failed to log activity:', activityError);
      }

      return res.status(201).json(bookmark);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create bookmark' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
