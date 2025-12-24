import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: original, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !original) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const newId = nanoid();

    const { data: newTemplate, error: insertError } = await supabase
      .from('email_templates')
      .insert({
        id: newId,
        name: original.name + ' (Copy)',
        subject: original.subject,
        preview_text: original.preview_text,
        html_content: original.html_content,
        json_content: original.json_content,
        category: original.category,
        variables: original.variables,
        is_active: false,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to duplicate template' });
    }

    return res.status(201).json(newTemplate);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate template' });
  }
}
