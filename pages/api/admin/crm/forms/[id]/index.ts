import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      const { data: form, error } = await supabase
        .from('forms')
        .select(`
          *,
          list:contact_lists(*)
        `)
        .eq('id', id as string)
        .single();

      if (error || !form) {
        return res.status(404).json({ error: 'Form not found' });
      }

      return res.status(200).json(form);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch form' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const supabase = supabaseAdmin();
      const { name, fields, settings, thankYouMessage, redirectUrl, listId, tags, notifyEmails, status } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (fields !== undefined) updateData.fields = fields;
      if (settings !== undefined) updateData.settings = settings;
      if (thankYouMessage !== undefined) updateData.thank_you_message = thankYouMessage;
      if (redirectUrl !== undefined) updateData.redirect_url = redirectUrl;
      if (listId !== undefined) updateData.list_id = listId;
      if (tags !== undefined) updateData.tags = tags;
      if (notifyEmails !== undefined) updateData.notify_emails = notifyEmails;
      if (status !== undefined) updateData.status = status;

      updateData.updated_at = new Date().toISOString();

      const { data: form, error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id as string)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update form' });
      }

      return res.status(200).json(form);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update form' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const supabase = supabaseAdmin();

      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id as string);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete form' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete form' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
