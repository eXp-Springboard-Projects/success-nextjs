import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const { category, is_public, created_by } = req.query;

      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (is_public !== undefined) {
        query = query.eq('is_public', is_public === 'true');
      }

      if (created_by) {
        query = query.eq('created_by', created_by);
      }

      const { data: templates, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json(templates || []);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        category,
        structure,
        thumbnail,
        isPublic = true,
      } = req.body;

      if (!name || !structure) {
        return res.status(400).json({ error: 'Name and structure are required' });
      }

      const { data: template, error } = await supabase
        .from('templates')
        .insert({
          id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          description: description || null,
          category: category || 'custom',
          structure,
          thumbnail: thumbnail || null,
          is_public: isPublic,
          created_by: session.user.id,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'CREATE',
          entity: 'template',
          entityId: template.id,
          details: JSON.stringify({ name: template.name }),
        });

      return res.status(201).json(template);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
