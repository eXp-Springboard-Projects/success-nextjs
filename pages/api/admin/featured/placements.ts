import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  // GET - Fetch all active placements
  if (req.method === 'GET') {
    try {
      const { data: placements, error } = await supabase
        .from('homepage_placements')
        .select('*')
        .eq('active', true)
        .order('zone')
        .order('position');

      if (error) throw error;

      return res.status(200).json(placements || []);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch placements', message: error.message });
    }
  }

  // POST - Create new placement
  if (req.method === 'POST') {
    try {
      const { postId, zone, position } = req.body;

      if (!postId || !zone) {
        return res.status(400).json({ error: 'postId and zone are required' });
      }

      const newPlacement = {
        id: randomUUID(),
        postId,
        zone,
        position: position || 0,
        active: true,
        createdBy: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('homepage_placements')
        .insert(newPlacement)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create placement', message: error.message });
    }
  }

  // DELETE - Remove placement
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Placement ID is required' });
      }

      const { error } = await supabase
        .from('homepage_placements')
        .delete()
        .eq('id', id as string);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Placement removed' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete placement', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
