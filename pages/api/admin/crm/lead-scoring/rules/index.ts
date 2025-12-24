import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      const { data: rules, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch scoring rules:', error);
        return res.status(500).json({ error: 'Failed to fetch scoring rules' });
      }

      return res.status(200).json({ rules });
    } catch (error) {
      console.error('Failed to fetch scoring rules:', error);
      return res.status(500).json({ error: 'Failed to fetch scoring rules' });
    }
  }

  if (req.method === 'POST') {
    try {
      const supabase = supabaseAdmin();
      const { name, eventType, points } = req.body;

      const { data: rule, error } = await supabase
        .from('lead_scoring_rules')
        .insert({
          id: uuidv4(),
          name,
          event_type: eventType,
          points,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create scoring rule:', error);
        return res.status(500).json({ error: 'Failed to create scoring rule' });
      }

      return res.status(201).json(rule);
    } catch (error) {
      console.error('Failed to create scoring rule:', error);
      return res.status(500).json({ error: 'Failed to create scoring rule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
