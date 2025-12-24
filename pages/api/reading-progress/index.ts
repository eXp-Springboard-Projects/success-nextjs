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

  // GET - Fetch user's reading progress
  if (req.method === 'GET') {
    try {
      const { completed } = req.query;

      let query = supabase
        .from('reading_progress')
        .select('*')
        .eq('userId', userId)
        .order('lastReadAt', { ascending: false })
        .limit(20);

      if (completed === 'true') {
        query = query.eq('completed', true);
      } else if (completed === 'false') {
        query = query.eq('completed', false);
      }

      const { data: progress, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json(progress || []);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch reading progress' });
    }
  }

  // POST - Update reading progress
  if (req.method === 'POST') {
    try {
      const { articleId, articleTitle, articleUrl, progress } = req.body;

      if (!articleId || !articleTitle || !articleUrl || typeof progress !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (progress < 0 || progress > 100) {
        return res.status(400).json({ error: 'Progress must be between 0 and 100' });
      }

      const completed = progress >= 90; // Consider 90%+ as completed

      // Check if reading progress exists
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('userId', userId)
        .eq('articleId', articleId)
        .single();

      let readingProgress;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('reading_progress')
          .update({
            progress,
            completed,
            lastReadAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('userId', userId)
          .eq('articleId', articleId)
          .select()
          .single();

        if (error) throw error;
        readingProgress = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('reading_progress')
          .insert({
            id: randomUUID(),
            userId,
            articleId,
            articleTitle,
            articleUrl,
            progress,
            completed,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        readingProgress = data;
      }

      // Create activity log if article was completed
      if (completed && progress >= 90) {
        // Check if we already logged this completion
        const { data: existingActivity } = await supabase
          .from('user_activities')
          .select('id')
          .eq('userId', userId)
          .eq('activityType', 'ARTICLE_READ')
          .ilike('metadata', `%${articleId}%`)
          .single();

        if (!existingActivity) {
          await supabase
            .from('user_activities')
            .insert({
              id: randomUUID(),
              userId,
              activityType: 'ARTICLE_READ',
              title: `Read: ${articleTitle}`,
              metadata: JSON.stringify({ articleId, articleUrl }),
            });
        }
      }

      return res.status(200).json(readingProgress);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update reading progress' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
