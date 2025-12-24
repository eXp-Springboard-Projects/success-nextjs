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

    // Pipeline value over time
    const { data: pipelineOverTime } = await supabase.rpc('get_pipeline_over_time', {
      cutoff_date: cutoffDate.toISOString(),
    });

    // Win/Loss rate
    const { data: winLossRate } = await supabase.rpc('get_win_loss_rate', {
      cutoff_date: cutoffDate.toISOString(),
    });

    const wonCount = Number(winLossRate?.find((r: any) => r.stage === 'won')?.count || 0);
    const lostCount = Number(winLossRate?.find((r: any) => r.stage === 'lost')?.count || 0);

    // Average deal size
    const { data: avgDealSizeResult } = await supabase.rpc('get_avg_deal_size', {
      cutoff_date: cutoffDate.toISOString(),
    });

    const avgDealSize = avgDealSizeResult?.[0]?.avg || 0;

    // Average sales cycle length
    const { data: avgSalesCycleResult } = await supabase.rpc('get_avg_sales_cycle', {
      cutoff_date: cutoffDate.toISOString(),
    });

    const avgSalesCycle = Math.round(avgSalesCycleResult?.[0]?.avg || 0);

    // Revenue by owner
    const { data: revenueByOwner } = await supabase.rpc('get_revenue_by_owner', {
      cutoff_date: cutoffDate.toISOString(),
    });

    return res.status(200).json({
      pipelineOverTime: (pipelineOverTime || []).map((p: any) => ({
        date: p.date,
        value: Number(p.value),
      })),
      winLossRate: {
        won: wonCount,
        lost: lostCount,
      },
      avgDealSize: Number(avgDealSize),
      avgSalesCycle,
      revenueByOwner: (revenueByOwner || []).map((r: any) => ({
        owner: r.owner_name || 'Unassigned',
        revenue: Number(r.revenue),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deal reports' });
  }
}
