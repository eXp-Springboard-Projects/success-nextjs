import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

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
      // Fetch all campaigns
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ message: 'Failed to fetch campaigns' });
      }

      // Fetch counts for each campaign
      const campaignsWithCounts = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          const { count: contactCount } = await supabase
            .from('campaign_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('campaignId', campaign.id);

          const { count: emailCount } = await supabase
            .from('drip_emails')
            .select('*', { count: 'exact', head: true })
            .eq('campaignId', campaign.id);

          return {
            ...campaign,
            _count: {
              campaign_contacts: contactCount || 0,
              drip_emails: emailCount || 0,
            },
          };
        })
      );

      return res.status(200).json(campaignsWithCounts);
    }

    if (req.method === 'POST') {
      const { name, subject, scheduledAt } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ message: 'Name and subject are required' });
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          id: randomUUID(),
          name,
          subject,
          status: 'DRAFT',
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: 'Failed to create campaign' });
      }

      return res.status(201).json(campaign);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
