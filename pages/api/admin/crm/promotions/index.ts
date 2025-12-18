import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

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
    const query = req.query;
    const status = (query.status as string) || '';
    const page = (query.page as string) || '1';
    const limit = (query.limit as string) || '50';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const promotions = await prisma.$queryRawUnsafe<Array<any>>(
      `
      SELECT *
      FROM promotions
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      ...params,
      parseInt(limit),
      offset
    );

    const totalCount = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
      SELECT COUNT(*)::int as count
      FROM promotions
      WHERE 1=1 ${whereClause}
    `,
      ...params
    );

    return res.status(200).json({
      promotions,
      total: totalCount[0].count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch promotions' });
  }
}

async function createPromotion(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
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

    await prisma.$executeRaw`
      INSERT INTO promotions (
        id, code, discount_type, discount_amount,
        min_purchase_amount, max_discount_amount, usage_limit,
        expires_at, description, created_by
      ) VALUES (
        ${promotionId},
        ${code},
        ${discountType},
        ${discountAmount},
        ${minPurchaseAmount || null},
        ${maxDiscountAmount || null},
        ${usageLimit || null},
        ${expiresAt || null},
        ${description || null},
        ${session.user.email}
      )
    `;

    const promotion = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM promotions WHERE id = ${promotionId}
    `;

    return res.status(201).json(promotion[0]);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }
    return res.status(500).json({ error: 'Failed to create promotion' });
  }
}
