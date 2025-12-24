import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const supabase = supabaseAdmin();

    const { data: originalForm, error: fetchError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id as string)
      .single();

    if (fetchError || !originalForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { data: duplicatedForm, error: insertError } = await supabase
      .from('forms')
      .insert({
        id: uuidv4(),
        name: `${originalForm.name} (Copy)`,
        fields: originalForm.fields,
        settings: originalForm.settings,
        thank_you_message: originalForm.thank_you_message,
        redirect_url: originalForm.redirect_url,
        list_id: originalForm.list_id,
        tags: originalForm.tags,
        notify_emails: originalForm.notify_emails,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to duplicate form' });
    }

    return res.status(201).json(duplicatedForm);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate form' });
  }
}
