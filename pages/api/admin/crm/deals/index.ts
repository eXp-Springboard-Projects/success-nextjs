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
    return getDeals(req, res);
  } else if (req.method === 'POST') {
    return createDeal(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getDeals(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { stage = '', owner = '', startDate = '', endDate = '' } = req.query;

    let query = supabase
      .from('deals')
      .select(`
        *,
        stage:deal_stages(name, color, order),
        contact:contacts(email, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (stage) {
      query = query.eq('stage_id', stage);
    }

    if (owner) {
      query = query.eq('owner_id', owner);
    }

    if (startDate) {
      query = query.gte('expected_close_date', startDate);
    }

    if (endDate) {
      query = query.lte('expected_close_date', endDate);
    }

    const { data: dealsData, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch deals' });
    }

    // Flatten the structure to match original format
    const deals = dealsData?.map(d => ({
      ...d,
      stage_name: d.stage?.name,
      stage_color: d.stage?.color,
      stage_order: d.stage?.order,
      contact_email: d.contact?.email,
      contact_first_name: d.contact?.first_name,
      contact_last_name: d.contact?.last_name,
      stage: undefined,
      contact: undefined,
    }));

    return res.status(200).json({ deals });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deals' });
  }
}

async function createDeal(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      contactId,
      companyName,
      value = 0,
      currency = 'USD',
      stageId,
      probability,
      expectedCloseDate,
      source,
      notes,
      customFields = {},
    } = req.body;

    if (!name || !stageId) {
      return res.status(400).json({ error: 'Name and stage are required' });
    }

    const dealId = nanoid();

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        id: dealId,
        name,
        contact_id: contactId || null,
        company_name: companyName || null,
        value,
        currency,
        stage_id: stageId,
        probability: probability || null,
        expected_close_date: expectedCloseDate || null,
        owner_id: session.user.id,
        owner_name: session.user.name || session.user.email,
        source: source || null,
        notes: notes || null,
        custom_fields: customFields,
        status: 'open',
      })
      .select(`
        *,
        stage:deal_stages(name, color)
      `)
      .single();

    if (dealError) {
      return res.status(500).json({ error: 'Failed to create deal' });
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        id: nanoid(),
        deal_id: dealId,
        type: 'created',
        description: 'Deal created',
        created_by: session.user.id,
      });

    // Flatten the structure
    const result = {
      ...deal,
      stage_name: deal.stage?.name,
      stage_color: deal.stage?.color,
      stage: undefined,
    };

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create deal' });
  }
}
