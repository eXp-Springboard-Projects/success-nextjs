import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();
      const { status } = req.query;

      let query = supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as string);
      }

      const { data: forms, error } = await query;

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch forms' });
      }

      return res.status(200).json({ forms });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch forms' });
    }
  }

  if (req.method === 'POST') {
    try {
      const supabase = supabaseAdmin();
      const { name, fields, settings, thankYouMessage, redirectUrl, listId, tags, notifyEmails, status } = req.body;

      const { data: form, error } = await supabase
        .from('forms')
        .insert({
          id: uuidv4(),
          name,
          fields: fields || [],
          settings: settings || {},
          thank_you_message: thankYouMessage,
          redirect_url: redirectUrl,
          list_id: listId,
          tags: tags || [],
          notify_emails: notifyEmails || [],
          status: status || 'draft',
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create form' });
      }

      return res.status(201).json(form);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create form' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
