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

    // Contacts over time
    const { data: contactsOverTime } = await supabase.rpc('get_contacts_over_time', {
      cutoff_date: cutoffDate.toISOString(),
    });

    // Contacts by source
    const { data: contactsBySource } = await supabase.rpc('get_contacts_by_source', {
      cutoff_date: cutoffDate.toISOString(),
    });

    // Lead score distribution
    const { data: leadScoreDistribution } = await supabase.rpc('get_lead_score_distribution');

    // Total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    // Growth rate (compare this period to previous period)
    const previousCutoff = new Date(cutoffDate);
    previousCutoff.setDate(previousCutoff.getDate() - daysAgo);

    const { count: currentPeriodCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', cutoffDate.toISOString());

    const { count: previousPeriodCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', previousCutoff.toISOString())
      .lt('createdAt', cutoffDate.toISOString());

    const growthRate = (previousPeriodCount || 0) > 0
      ? (((currentPeriodCount || 0) - (previousPeriodCount || 0)) / (previousPeriodCount || 1)) * 100
      : 0;

    return res.status(200).json({
      contactsOverTime: (contactsOverTime || []).map((c: any) => ({
        date: c.date,
        count: Number(c.count),
      })),
      contactsBySource: (contactsBySource || []).map((c: any) => ({
        name: c.source,
        value: Number(c.count),
      })),
      leadScoreDistribution: (leadScoreDistribution || []).map((l: any) => ({
        range: l.range,
        count: Number(l.count),
      })),
      totalContacts: totalContacts || 0,
      growthRate,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch contact reports' });
  }
}
