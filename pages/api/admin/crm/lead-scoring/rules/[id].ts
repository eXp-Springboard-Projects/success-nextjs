import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const supabase = supabaseAdmin();
      const { name, eventType, points, isActive } = req.body;

      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updates.name = name;
      if (eventType !== undefined) updates.event_type = eventType;
      if (points !== undefined) updates.points = points;
      if (isActive !== undefined) updates.is_active = isActive;

      const { data: rule, error } = await supabase
        .from('lead_scoring_rules')
        .update(updates)
        .eq('id', id as string)
        .select()
        .single();

      if (error) {
        console.error('Failed to update scoring rule:', error);
        return res.status(500).json({ error: 'Failed to update scoring rule' });
      }

      return res.status(200).json(rule);
    } catch (error) {
      console.error('Failed to update scoring rule:', error);
      return res.status(500).json({ error: 'Failed to update scoring rule' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const supabase = supabaseAdmin();

      const { error } = await supabase
        .from('lead_scoring_rules')
        .delete()
        .eq('id', id as string);

      if (error) {
        console.error('Failed to delete scoring rule:', error);
        return res.status(500).json({ error: 'Failed to delete scoring rule' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete scoring rule:', error);
      return res.status(500).json({ error: 'Failed to delete scoring rule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
