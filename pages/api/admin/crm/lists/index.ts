import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { data: lists, error } = await supabase
        .from('contact_lists')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      return res.status(200).json(lists);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch lists' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, type, filters } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const { data: list, error } = await supabase
        .from('contact_lists')
        .insert({
          id: uuidv4(),
          name,
          description,
          type,
          filters: filters || null,
          memberCount: 0,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create list' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
