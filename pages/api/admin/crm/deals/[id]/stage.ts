import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid deal ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { stageId } = req.body;

    if (!stageId) {
      return res.status(400).json({ error: 'Stage ID is required' });
    }

    // Get old deal with stage info
    const { data: oldDeal, error: oldDealError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_stages!deals_stage_id_fkey (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (oldDealError || !oldDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Get new stage info
    const { data: newStage, error: newStageError } = await supabase
      .from('deal_stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (newStageError || !newStage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Update deal
    const { error: updateError } = await supabase
      .from('deals')
      .update({
        stage_id: stageId,
        probability: newStage.probability,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update deal:', updateError);
      return res.status(500).json({ error: 'Failed to update deal stage' });
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('deal_activities')
      .insert({
        id: nanoid(),
        deal_id: id,
        type: 'stage_changed',
        description: `Moved from ${oldDeal.deal_stages?.name || 'Unknown'} to ${newStage.name}`,
        metadata: {
          oldStage: oldDeal.deal_stages?.name || 'Unknown',
          newStage: newStage.name,
        },
        created_by: session.user.id,
      });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
    }

    // Fetch updated deal with stage info
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_stages!deals_stage_id_fkey (
          name,
          color
        )
      `)
      .eq('id', id)
      .single();

    if (dealError) {
      console.error('Failed to fetch updated deal:', dealError);
      return res.status(500).json({ error: 'Failed to update deal stage' });
    }

    // Transform the data to match the expected format
    const transformedDeal = {
      ...deal,
      stage_name: deal.deal_stages?.name,
      stage_color: deal.deal_stages?.color,
    };

    return res.status(200).json(transformedDeal);
  } catch (error) {
    console.error('Failed to update deal stage:', error);
    return res.status(500).json({ error: 'Failed to update deal stage' });
  }
}
