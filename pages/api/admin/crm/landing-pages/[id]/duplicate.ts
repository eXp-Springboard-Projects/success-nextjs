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
    return res.status(400).json({ error: 'Invalid landing page ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: original, error: fetchError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !original) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    const newId = nanoid();
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    const { data: newPage, error: insertError } = await supabase
      .from('landing_pages')
      .insert({
        id: newId,
        title: `${original.title} (Copy)`,
        slug: newSlug,
        content: original.content,
        meta_title: original.meta_title,
        meta_description: original.meta_description,
        template: original.template,
        form_id: original.form_id,
        status: 'draft',
        created_by: session.user.email,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to duplicate landing page' });
    }

    return res.status(201).json(newPage);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate landing page' });
  }
}
