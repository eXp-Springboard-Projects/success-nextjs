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
    return getCampaigns(req, res);
  } else if (req.method === 'POST') {
    return createCampaign(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCampaigns(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { status: statusFilter = '' } = req.query;

    let query = supabase
      .from('email_campaigns')
      .select('id, name, subject, status, sent_count, opened_count, clicked_count, bounced_count, failed_count, delivered_count, created_at, sent_at, scheduled_at')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toString().toUpperCase());
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Get campaigns error:', error);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

async function createCampaign(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      subject,
      scheduledAt,
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ error: 'Name and subject are required' });
    }

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        id: nanoid(),
        name,
        subject,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        failed_count: 0,
        delivered_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create campaign error:', error);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
}
