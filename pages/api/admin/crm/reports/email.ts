import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = '30' } = req.query;
    const daysAgo = parseInt(String(days));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const supabase = supabaseAdmin();

    // Sends over time
    const { data: sendsOverTime } = await supabase.rpc('get_sends_over_time', {
      cutoff_date: cutoffDate.toISOString(),
    });

    // Top campaigns
    const { data: topCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, sentCount, openedCount, clickedCount')
      .gte('sentAt', cutoffDate.toISOString())
      .order('openedCount', { ascending: false })
      .limit(10);

    const formattedCampaigns = (topCampaigns || []).map((c: any) => ({
      name: c.name,
      sent: Number(c.sentCount || 0),
      openRate: Number(c.sentCount || 0) > 0 ? (Number(c.openedCount || 0) / Number(c.sentCount || 0)) * 100 : 0,
      clickRate: Number(c.sentCount || 0) > 0 ? (Number(c.clickedCount || 0) / Number(c.sentCount || 0)) * 100 : 0,
    }));

    // Average rates
    const totalSent = (topCampaigns || []).reduce((sum: number, c: any) => sum + Number(c.sentCount || 0), 0);
    const totalOpens = (topCampaigns || []).reduce((sum: number, c: any) => sum + Number(c.openedCount || 0), 0);
    const totalClicks = (topCampaigns || []).reduce((sum: number, c: any) => sum + Number(c.clickedCount || 0), 0);

    const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const avgClickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

    // Unsubscribe rate
    const { count: unsubscribeCount } = await supabase
      .from('email_preferences')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', true)
      .gte('unsubscribedAt', cutoffDate.toISOString());

    const unsubscribeRate = totalSent > 0 ? ((unsubscribeCount || 0) / totalSent) * 100 : 0;

    return res.status(200).json({
      sendsOverTime: (sendsOverTime || []).map((s: any) => ({
        date: s.date,
        sends: Number(s.sends),
        opens: Number(s.opens),
        clicks: Number(s.clicks),
      })),
      topCampaigns: formattedCampaigns,
      avgOpenRate,
      avgClickRate,
      unsubscribeRate,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch email reports' });
  }
}
