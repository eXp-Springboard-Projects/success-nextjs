import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          users:assignedToId(id, name, email, avatar),
          creator:createdBy(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch project' });
    }
  }

  if (req.method === 'PATCH') {
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
        order,
      } = req.body;

      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
      if (tags !== undefined) updateData.tags = tags;
      if (notes !== undefined) updateData.notes = notes;
      if (order !== undefined) updateData.order = order;

      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users:assignedToId(id, name, email, avatar),
          creator:createdBy(id, name, email)
        `)
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update project' });
      }

      return res.status(200).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const supabase = supabaseAdmin();

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete project' });
      }

      return res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete project' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
