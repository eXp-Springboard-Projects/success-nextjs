import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get email send stats
    const { data: sends, error: sendsError } = await supabase
      .from('email_sends')
      .select('*')
      .eq('campaign_id', id);

    if (sendsError) {
      throw sendsError;
    }

    const stats = {
      sent: sends.filter(s => s.status === 'sent').length,
      delivered: sends.filter(s => s.status === 'delivered').length,
      opened: sends.filter(s => s.opened_at !== null).length,
      clicked: sends.filter(s => s.clicked_at !== null).length,
      bounced: sends.filter(s => s.bounced_at !== null).length,
      failed: sends.filter(s => s.status === 'failed').length,
    };

    // Get timeline data (grouped by day)
    const opensData = sends.filter(s => s.opened_at !== null);
    const timelineMap = new Map<string, { opens: number, clicks: number }>();

    opensData.forEach(send => {
      const date = send.opened_at.split('T')[0];
      const existing = timelineMap.get(date) || { opens: 0, clicks: 0 };
      existing.opens++;
      if (send.clicked_at) {
        existing.clicks++;
      }
      timelineMap.set(date, existing);
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const openRate = campaign.total_sent > 0 ? ((stats.opened / campaign.total_sent) * 100).toFixed(2) : '0.00';
    const clickRate = campaign.total_sent > 0 ? ((stats.clicked / campaign.total_sent) * 100).toFixed(2) : '0.00';

    return res.status(200).json({
      campaign,
      stats: {
        ...stats,
        openRate,
        clickRate,
      },
      timeline,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign report' });
  }
}
