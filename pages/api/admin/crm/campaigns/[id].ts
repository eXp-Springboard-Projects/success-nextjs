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
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  if (req.method === 'GET') {
    return getCampaign(id, res);
  } else if (req.method === 'PATCH') {
    return updateCampaign(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteCampaign(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCampaign(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select(`
        *,
        template:email_templates(name, html_content),
        list:contact_lists(name)
      `)
      .eq('id', id)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Flatten the nested structure to match the original format
    const result = {
      ...campaign,
      template_name: campaign.template?.name,
      template_html: campaign.template?.html_content,
      list_name: campaign.list?.name,
    };
    delete result.template;
    delete result.list;

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign' });
  }
}

async function updateCampaign(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      subject,
      previewText,
      templateId,
      listId,
      segmentFilters,
      fromEmail,
      fromName,
      status,
    } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (previewText !== undefined) updateData.preview_text = previewText;
    if (templateId !== undefined) updateData.template_id = templateId;
    if (listId !== undefined) updateData.list_id = listId;
    if (segmentFilters !== undefined) updateData.segment_filters = segmentFilters;
    if (fromEmail !== undefined) updateData.from_email = fromEmail;
    if (fromName !== undefined) updateData.from_name = fromName;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .select()
        .eq('id', id)
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch campaign' });
      }
      return res.status(200).json(campaign);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update campaign' });
    }

    return res.status(200).json(campaign);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
}

async function deleteCampaign(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
}
