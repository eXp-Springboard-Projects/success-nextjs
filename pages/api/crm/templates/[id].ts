import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  const supabase = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (templateError || !template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Fetch campaigns using this template
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('templateId', id);

      const result = {
        ...template,
        campaigns: campaigns || [],
      };

      return res.status(200).json(result);
    }

    if (req.method === 'PUT') {
      const { name, subject, content, blocks, isDefault } = req.body;

      // If this is set as default, unset all other defaults
      if (isDefault) {
        await supabase
          .from('email_templates')
          .update({ isDefault: false })
          .eq('isDefault', true)
          .neq('id', id);
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (subject !== undefined) updateData.subject = subject;
      if (content !== undefined) updateData.content = content;
      if (isDefault !== undefined) updateData.isDefault = isDefault;

      const { data: template, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: 'Failed to update template' });
      }

      return res.status(200).json(template);
    }

    if (req.method === 'DELETE') {
      // Check if template is in use
      const { count, error: countError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('templateId', id);

      if (countError) {
        return res.status(500).json({ message: 'Failed to check template usage' });
      }

      if (count && count > 0) {
        return res.status(400).json({
          message: `Cannot delete template. It is currently used in ${count} campaign(s).`
        });
      }

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ message: 'Failed to delete template' });
      }

      return res.status(200).json({ message: 'Template deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
