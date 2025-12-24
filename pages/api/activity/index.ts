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

  // GET - Fetch user's activity feed
  if (req.method === 'GET') {
    try {
      const { limit = '20', type } = req.query;

      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(parseInt(limit as string));

      if (type && typeof type === 'string') {
        query = query.eq('activityType', type);
      }

      const { data: activities, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json(activities || []);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }
  }

  // POST - Create a new activity
  if (req.method === 'POST') {
    try {
      const { activityType, title, description, metadata } = req.body;

      if (!activityType || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: activity, error } = await supabase
        .from('user_activities')
        .insert({
          id: randomUUID(),
          userId,
          activityType,
          title,
          description: description || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(activity);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create activity' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
