import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { status } = req.query;

      let query = supabase
        .from('editorial_calendar')
        .select(`
          *,
          users:assignedToId (
            name,
            email
          )
        `)
        .order('priority', { ascending: false })
        .order('scheduledDate', { ascending: true })
        .order('createdAt', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: items, error } = await query;

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch editorial items' });
      }

      return res.status(200).json(items || []);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch editorial items' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        contentType,
        status,
        priority,
        scheduledDate,
        deadline,
        notes,
        assignedToId,
      } = req.body;

      const { data: item, error } = await supabase
        .from('editorial_calendar')
        .insert({
          id: randomUUID(),
          title,
          contentType: contentType || 'ARTICLE',
          status: status || 'IDEA',
          priority: priority || 'MEDIUM',
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          notes,
          assignedToId,
          updatedAt: new Date().toISOString(),
        })
        .select(`
          *,
          users:assignedToId (
            name,
            email
          )
        `)
        .single();

      if (error || !item) {
        return res.status(500).json({ error: 'Failed to create editorial item' });
      }

      return res.status(201).json(item);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create editorial item' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
