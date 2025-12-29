import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userRole = (session.user as any).role;
  if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Get override for a specific page
      const { page_path } = req.query;

      if (page_path) {
        const { data, error } = await supabase
          .from('page_overrides')
          .select('*')
          .eq('page_path', page_path as string)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data || { page_path, overrides: {} });
      }

      // Get all page overrides
      const { data, error } = await supabase
        .from('page_overrides')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data || []);

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { page_path, overrides } = req.body;

      if (!page_path) {
        return res.status(400).json({ error: 'page_path is required' });
      }

      const userId = (session.user as any).id;
      const now = new Date().toISOString();

      // Check if override exists
      const { data: existing } = await supabase
        .from('page_overrides')
        .select('id')
        .eq('page_path', page_path)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('page_overrides')
          .update({
            overrides: overrides || {},
            updated_by: userId,
            updated_at: now,
          })
          .eq('page_path', page_path)
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
      } else {
        // Create new
        const { data, error } = await supabase
          .from('page_overrides')
          .insert({
            page_path,
            overrides: overrides || {},
            created_by: userId,
            updated_by: userId,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
      }

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { page_path } = req.query;

      if (!page_path) {
        return res.status(400).json({ error: 'page_path is required' });
      }

      const { error } = await supabase
        .from('page_overrides')
        .delete()
        .eq('page_path', page_path as string);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
