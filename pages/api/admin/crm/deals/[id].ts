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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid deal ID' });
  }

  if (req.method === 'GET') {
    return getDeal(id, res);
  } else if (req.method === 'PATCH') {
    return updateDeal(id, req, res, session);
  } else if (req.method === 'DELETE') {
    return deleteDeal(id, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getDeal(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        stage:deal_stages(name, color, order),
        contact:contacts(id, email, first_name, last_name, phone, company)
      `)
      .eq('id', id)
      .single();

    if (error || !deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const { data: activities } = await supabase
      .from('deal_activities')
      .select('*')
      .eq('deal_id', id)
      .order('created_at', { ascending: false });

    // Flatten the structure
    const result = {
      ...deal,
      stage_name: deal.stage?.name,
      stage_color: deal.stage?.color,
      stage_order: deal.stage?.order,
      contact_id: deal.contact?.id,
      contact_email: deal.contact?.email,
      contact_first_name: deal.contact?.first_name,
      contact_last_name: deal.contact?.last_name,
      contact_phone: deal.contact?.phone,
      contact_company: deal.contact?.company,
      stage: undefined,
      contact: undefined,
      activities,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deal' });
  }
}

async function updateDeal(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      contactId,
      companyName,
      value,
      currency,
      stageId,
      probability,
      expectedCloseDate,
      actualCloseDate,
      source,
      notes,
      customFields,
      status,
      lostReason,
    } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (contactId !== undefined) updateData.contact_id = contactId;
    if (companyName !== undefined) updateData.company_name = companyName;
    if (value !== undefined) updateData.value = value;
    if (currency !== undefined) updateData.currency = currency;
    if (stageId !== undefined) updateData.stage_id = stageId;
    if (probability !== undefined) updateData.probability = probability;
    if (expectedCloseDate !== undefined) updateData.expected_close_date = expectedCloseDate;
    if (actualCloseDate !== undefined) updateData.actual_close_date = actualCloseDate;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (status !== undefined) updateData.status = status;
    if (lostReason !== undefined) updateData.lost_reason = lostReason;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        stage:deal_stages(name, color)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update deal' });
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        id: nanoid(),
        deal_id: id,
        type: 'updated',
        description: 'Deal updated',
        created_by: session.user.id,
      });

    // Flatten the structure
    const result = {
      ...deal,
      stage_name: deal.stage?.name,
      stage_color: deal.stage?.color,
      stage: undefined,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update deal' });
  }
}

async function deleteDeal(id: string, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete deal' });
    }

    return res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete deal' });
  }
}
