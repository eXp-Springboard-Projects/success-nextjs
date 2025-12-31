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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json(template);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        name,
        description,
        category,
        structure,
        thumbnail,
        isPublic,
      } = req.body;

      const { data: template, error } = await supabase
        .from('templates')
        .update({
          name,
          description,
          category,
          structure,
          thumbnail,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
          action: 'UPDATE',
          entity: 'template',
          entityId: id as string,
          details: JSON.stringify({ name: template.name }),
        });

      return res.status(200).json(template);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'DELETE',
          entity: 'template',
          entityId: id as string,
          details: JSON.stringify({}),
        });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
