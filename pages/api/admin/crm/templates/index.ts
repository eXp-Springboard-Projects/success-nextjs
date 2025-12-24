import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getTemplates(req, res);
  } else if (req.method === 'POST') {
    return createTemplate(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { category = '', search = '' } = req.query;

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

async function createTemplate(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      subject,
      previewText,
      htmlContent,
      jsonContent = {},
      category = 'transactional',
      variables = [],
      fromEmail,
      fromName,
    } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Name, subject, and HTML content are required' });
    }

    const templateId = nanoid();

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        id: templateId,
        name,
        subject,
        preview_text: previewText || null,
        html_content: htmlContent,
        json_content: jsonContent,
        category,
        variables,
        is_active: true,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create template' });
    }

    return res.status(201).json(template);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create template' });
  }
}
