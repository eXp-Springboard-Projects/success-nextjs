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
    const supabase = supabaseAdmin();

    // Get stage statistics
    const { data: stages, error: stagesError } = await supabase
      .from('deal_stages')
      .select('id, name, color, order');

    if (stagesError) {
      console.error('Failed to fetch deal stages:', stagesError);
      return res.status(500).json({ error: 'Failed to fetch deal stats' });
    }

    // Get deals for each stage
    const stageStats = await Promise.all(
      stages.map(async (stage) => {
        const { data: deals, error } = await supabase
          .from('deals')
          .select('id, value')
          .eq('stage_id', stage.id)
          .eq('status', 'open');

        const deal_count = deals?.length || 0;
        const total_value = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

        return {
          stage_id: stage.id,
          stage_name: stage.name,
          stage_color: stage.color,
          stage_order: stage.order,
          deal_count,
          total_value,
        };
      })
    );

    // Sort by stage order
    stageStats.sort((a, b) => a.stage_order - b.stage_order);

    // Get total statistics
    const { data: allDeals, error: dealsError } = await supabase
      .from('deals')
      .select('status, value');

    if (dealsError) {
      console.error('Failed to fetch deals:', dealsError);
      return res.status(500).json({ error: 'Failed to fetch deal stats' });
    }

    const totals = {
      open_deals: allDeals?.filter(d => d.status === 'open').length || 0,
      won_deals: allDeals?.filter(d => d.status === 'won').length || 0,
      lost_deals: allDeals?.filter(d => d.status === 'lost').length || 0,
      open_value: allDeals?.filter(d => d.status === 'open').reduce((sum, d) => sum + (d.value || 0), 0) || 0,
      won_value: allDeals?.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.value || 0), 0) || 0,
      lost_value: allDeals?.filter(d => d.status === 'lost').reduce((sum, d) => sum + (d.value || 0), 0) || 0,
    };

    return res.status(200).json({
      stages: stageStats,
      totals,
    });
  } catch (error) {
    console.error('Failed to fetch deal stats:', error);
    return res.status(500).json({ error: 'Failed to fetch deal stats' });
  }
}
