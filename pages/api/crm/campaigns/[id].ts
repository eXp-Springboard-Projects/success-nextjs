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
    return res.status(400).json({ message: 'Invalid campaign ID' });
  }

  const supabase = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      // Fetch campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError || !campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Fetch drip emails
      const { data: drip_emails } = await supabase
        .from('drip_emails')
        .select('*')
        .eq('campaignId', id)
        .order('order', { ascending: true });

      // Fetch campaign contacts with contact details
      const { data: campaign_contacts } = await supabase
        .from('campaign_contacts')
        .select('*, contacts(*)')
        .eq('campaignId', id);

      // Fetch email template
      const { data: email_templates } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', campaign.templateId)
        .single();

      const result = {
        ...campaign,
        drip_emails: drip_emails || [],
        campaign_contacts: campaign_contacts || [],
        email_templates,
      };

      return res.status(200).json(result);
    }

    if (req.method === 'PUT') {
      const { name, subject, status, scheduledAt } = req.body;

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name;
      if (subject !== undefined) updateData.subject = subject;
      if (status !== undefined) updateData.status = status;
      if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null;

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: 'Failed to update campaign' });
      }

      return res.status(200).json(campaign);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ message: 'Failed to delete campaign' });
      }

      return res.status(200).json({ message: 'Campaign deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
