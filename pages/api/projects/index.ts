import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();
      const { status, assignedToId, priority, search } = req.query;

      let query = supabase
        .from('projects')
        .select(`
          *,
          users:assignedToId(id, name, email, avatar),
          creator:createdBy(id, name, email)
        `);

      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }

      if (assignedToId && assignedToId !== 'ALL') {
        query = query.eq('assignedToId', assignedToId);
      }

      if (priority && priority !== 'ALL') {
        query = query.eq('priority', priority);
      }

      if (search && typeof search === 'string') {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: projects, error } = await query
        .order('status', { ascending: true })
        .order('order', { ascending: true })
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      return res.status(200).json({ projects });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  if (req.method === 'POST') {
    try {
      const supabase = supabaseAdmin();
      const {
        title,
        description,
        status,
        assignedToId,
        priority,
        dueDate,
        tags,
        notes,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          id: randomUUID(),
          title,
          description: description || null,
          status: status || 'BACKLOG',
          assignedToId: assignedToId || null,
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          createdBy: session.user.id,
          tags: tags || [],
          notes: notes || null,
        })
        .select(`
          *,
          users:assignedToId(id, name, email, avatar),
          creator:createdBy(id, name, email)
        `)
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create project' });
      }

      return res.status(201).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
