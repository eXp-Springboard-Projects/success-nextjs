import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  if (req.method === 'GET') {
    return getTemplate(id, res);
  } else if (req.method === 'PATCH') {
    return updateTemplate(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteTemplate(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplate(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.status(200).json(template);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch template' });
  }
}

async function updateTemplate(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      subject,
      previewText,
      htmlContent,
      jsonContent,
      category,
      variables,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (previewText !== undefined) updateData.preview_text = previewText;
    if (htmlContent !== undefined) updateData.html_content = htmlContent;
    if (jsonContent !== undefined) updateData.json_content = jsonContent;
    if (category !== undefined) updateData.category = category;
    if (variables !== undefined) updateData.variables = variables;
    if (isActive !== undefined) updateData.is_active = isActive;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { data: template, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update template' });
      }

      return res.status(200).json(template);
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch template' });
    }

    return res.status(200).json(template);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update template' });
  }
}

async function deleteTemplate(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete template' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete template' });
  }
}
