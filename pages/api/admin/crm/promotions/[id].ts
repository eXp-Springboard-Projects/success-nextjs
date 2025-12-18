import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const promotion = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM promotions WHERE id = ${id}
    `;

    if (promotion.length === 0) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    return res.status(200).json(promotion[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch promotion' });
  }
}

async function updatePromotion(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
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

    await prisma.$executeRaw`
      UPDATE promotions
      SET
        code = COALESCE(${code}, code),
        discount_type = COALESCE(${discountType}, discount_type),
        discount_amount = COALESCE(${discountAmount}, discount_amount),
        min_purchase_amount = ${minPurchaseAmount},
        max_discount_amount = ${maxDiscountAmount},
        usage_limit = ${usageLimit},
        expires_at = ${expiresAt},
        status = COALESCE(${status}, status),
        description = ${description},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const promotion = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM promotions WHERE id = ${id}
    `;

    return res.status(200).json(promotion[0]);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    return res.status(500).json({ error: 'Failed to update promotion' });
  }
}

async function deletePromotion(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`
      DELETE FROM promotions WHERE id = ${id}
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete promotion' });
  }
}
