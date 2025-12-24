import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid promotion ID' });
  }

  if (req.method === 'GET') {
    return getPromotion(id, res);
  } else if (req.method === 'PATCH') {
    return updatePromotion(id, req, res);
  } else if (req.method === 'DELETE') {
    return deletePromotion(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPromotion(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    return res.status(200).json(promotion);
  } catch (error) {
    console.error('Failed to fetch promotion:', error);
    return res.status(500).json({ error: 'Failed to fetch promotion' });
  }
}

async function updatePromotion(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      code,
      discountType,
      discountAmount,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      expiresAt,
      status,
      description,
    } = req.body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (code !== undefined) updates.code = code;
    if (discountType !== undefined) updates.discount_type = discountType;
    if (discountAmount !== undefined) updates.discount_amount = discountAmount;
    if (minPurchaseAmount !== undefined) updates.min_purchase_amount = minPurchaseAmount;
    if (maxDiscountAmount !== undefined) updates.max_discount_amount = maxDiscountAmount;
    if (usageLimit !== undefined) updates.usage_limit = usageLimit;
    if (expiresAt !== undefined) updates.expires_at = expiresAt;
    if (status !== undefined) updates.status = status;
    if (description !== undefined) updates.description = description;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update promotion:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Promotion code already exists' });
      }
      return res.status(500).json({ error: 'Failed to update promotion' });
    }

    return res.status(200).json(promotion);
  } catch (error: any) {
    console.error('Failed to update promotion:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    return res.status(500).json({ error: 'Failed to update promotion' });
  }
}

async function deletePromotion(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete promotion:', error);
      return res.status(500).json({ error: 'Failed to delete promotion' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to delete promotion:', error);
    return res.status(500).json({ error: 'Failed to delete promotion' });
  }
}
