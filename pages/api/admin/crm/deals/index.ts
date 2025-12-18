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
    return getDeals(req, res);
  } else if (req.method === 'POST') {
    return createDeal(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getDeals(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stage = '', owner = '', startDate = '', endDate = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (stage) {
      whereClause += ` AND d.stage_id = $${paramIndex}`;
      params.push(stage);
      paramIndex++;
    }

    if (owner) {
      whereClause += ` AND d.owner_id = $${paramIndex}`;
      params.push(owner);
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND d.expected_close_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND d.expected_close_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const deals = await prisma.$queryRawUnsafe(`
      SELECT
        d.*,
        s.name as stage_name,
        s.color as stage_color,
        s.order as stage_order,
        c.email as contact_email,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE 1=1 ${whereClause}
      ORDER BY d.created_at DESC
    `, ...params);

    return res.status(200).json({ deals });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deals' });
  }
}

async function createDeal(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
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

    await prisma.$executeRaw`
      INSERT INTO deals (
        id, name, contact_id, company_name, value, currency, stage_id, probability,
        expected_close_date, owner_id, owner_name, source, notes, custom_fields, status
      ) VALUES (
        ${dealId}, ${name}, ${contactId || null}, ${companyName || null}, ${value},
        ${currency}, ${stageId}, ${probability || null}, ${expectedCloseDate || null},
        ${session.user.id}, ${session.user.name || session.user.email},
        ${source || null}, ${notes || null}, ${JSON.stringify(customFields)}::jsonb, 'open'
      )
    `;

    // Log activity
    await prisma.$executeRaw`
      INSERT INTO deal_activities (id, deal_id, type, description, created_by)
      VALUES (${nanoid()}, ${dealId}, 'created', 'Deal created', ${session.user.id})
    `;

    const deal = await prisma.$queryRaw<Array<any>>`
      SELECT d.*, s.name as stage_name, s.color as stage_color
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      WHERE d.id = ${dealId}
    `;

    return res.status(201).json(deal[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create deal' });
  }
}
