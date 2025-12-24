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
    return getPromotions(req, res);
  } else if (req.method === 'POST') {
    return createPromotion(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPromotions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const query = req.query;
    const status = (query.status as string) || '';
    const page = (query.page as string) || '1';
    const limit = (query.limit as string) || '50';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let promotionsQuery = supabase
      .from('promotions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      promotionsQuery = promotionsQuery.eq('status', status);
    }

    const { data: promotions, error, count } = await promotionsQuery;

    if (error) {
      console.error('Failed to fetch promotions:', error);
      return res.status(500).json({ error: 'Failed to fetch promotions' });
    }

    return res.status(200).json({
      promotions,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    return res.status(500).json({ error: 'Failed to fetch promotions' });
  }
}

async function createPromotion(req: NextApiRequest, res: NextApiResponse, session: any) {
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
      description,
    } = req.body;

    if (!code || !discountType || !discountAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const promotionId = nanoid();

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert({
        id: promotionId,
        code,
        discount_type: discountType,
        discount_amount: discountAmount,
        min_purchase_amount: minPurchaseAmount || null,
        max_discount_amount: maxDiscountAmount || null,
        usage_limit: usageLimit || null,
        expires_at: expiresAt || null,
        description: description || null,
        created_by: session.user.email,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create promotion:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Promotion code already exists' });
      }
      return res.status(500).json({ error: 'Failed to create promotion' });
    }

    return res.status(201).json(promotion);
  } catch (error: any) {
    console.error('Failed to create promotion:', error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create promotion' });
  }
}
