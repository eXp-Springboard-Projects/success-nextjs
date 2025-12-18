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
    const deal = await prisma.$queryRaw<Array<any>>`
      SELECT
        d.*,
        s.name as stage_name,
        s.color as stage_color,
        s.order as stage_order,
        c.id as contact_id,
        c.email as contact_email,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.phone as contact_phone,
        c.company as contact_company
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.id = ${id}
    `;

    if (deal.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const activities = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM deal_activities
      WHERE deal_id = ${id}
      ORDER BY created_at DESC
    `;

    return res.status(200).json({ ...deal[0], activities });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deal' });
  }
}

async function updateDeal(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
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

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (contactId !== undefined) {
      updates.push(`contact_id = $${paramIndex}`);
      params.push(contactId);
      paramIndex++;
    }

    if (companyName !== undefined) {
      updates.push(`company_name = $${paramIndex}`);
      params.push(companyName);
      paramIndex++;
    }

    if (value !== undefined) {
      updates.push(`value = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex}`);
      params.push(currency);
      paramIndex++;
    }

    if (stageId !== undefined) {
      updates.push(`stage_id = $${paramIndex}`);
      params.push(stageId);
      paramIndex++;
    }

    if (probability !== undefined) {
      updates.push(`probability = $${paramIndex}`);
      params.push(probability);
      paramIndex++;
    }

    if (expectedCloseDate !== undefined) {
      updates.push(`expected_close_date = $${paramIndex}`);
      params.push(expectedCloseDate);
      paramIndex++;
    }

    if (actualCloseDate !== undefined) {
      updates.push(`actual_close_date = $${paramIndex}`);
      params.push(actualCloseDate);
      paramIndex++;
    }

    if (source !== undefined) {
      updates.push(`source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }

    if (customFields !== undefined) {
      updates.push(`custom_fields = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(customFields));
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (lostReason !== undefined) {
      updates.push(`lost_reason = $${paramIndex}`);
      params.push(lostReason);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    await prisma.$queryRawUnsafe(`
      UPDATE deals
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    // Log activity
    await prisma.$executeRaw`
      INSERT INTO deal_activities (id, deal_id, type, description, created_by)
      VALUES (${nanoid()}, ${id}, 'updated', 'Deal updated', ${session.user.id})
    `;

    const deal = await prisma.$queryRaw<Array<any>>`
      SELECT d.*, s.name as stage_name, s.color as stage_color
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      WHERE d.id = ${id}
    `;

    return res.status(200).json(deal[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update deal' });
  }
}

async function deleteDeal(id: string, res: NextApiResponse, session: any) {
  try {
    await prisma.$executeRaw`DELETE FROM deals WHERE id = ${id}`;
    return res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete deal' });
  }
}
