import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      // Get templates with campaign count
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select(`
          *,
          campaigns:campaigns(count)
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ message: 'Failed to fetch templates' });
      }

      // Transform the data to match the Prisma response format
      const formattedTemplates = templates?.map(template => ({
        ...template,
        _count: {
          campaigns: template.campaigns?.[0]?.count || 0
        },
        campaigns: undefined // Remove the campaigns field
      })) || [];

      return res.status(200).json(formattedTemplates);
    }

    if (req.method === 'POST') {
      const { name, subject, content, blocks, isDefault } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ message: 'Name and subject are required' });
      }

      // If this is set as default, unset all other defaults
      if (isDefault) {
        await supabase
          .from('email_templates')
          .update({ isDefault: false })
          .eq('isDefault', true);
      }

      const { data: template, error } = await supabase
        .from('email_templates')
        .insert({
          id: randomUUID(),
          name,
          subject,
          content: content || '',
          isDefault: isDefault || false,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !template) {
        return res.status(500).json({ message: 'Failed to create template' });
      }

      return res.status(201).json(template);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
