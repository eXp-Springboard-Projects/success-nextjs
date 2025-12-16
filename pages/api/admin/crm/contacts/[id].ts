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
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  if (req.method === 'GET') {
    return getContact(id, res);
  } else if (req.method === 'PATCH') {
    return updateContact(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteContact(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getContact(id: string, res: NextApiResponse) {
  try {
    const contact = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', ct.id, 'name', ct.name, 'color', ct.color))
          FILTER (WHERE ct.id IS NOT NULL),
          '[]'
        ) as tags,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', cl.id, 'name', cl.name))
          FILTER (WHERE cl.id IS NOT NULL),
          '[]'
        ) as lists
      FROM contacts c
      LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
      LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
      LEFT JOIN contact_list_members clm ON c.id = clm.contact_id
      LEFT JOIN contact_lists cl ON clm.list_id = cl.id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;

    if (contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const activities = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM contact_activities
      WHERE contact_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const notes = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM contact_notes
      WHERE contact_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const emailSends = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_sends
      WHERE contact_id = ${id}
      ORDER BY sent_at DESC
      LIMIT 20
    `;

    return res.status(200).json({
      ...contact[0],
      activities,
      notes,
      emailSends,
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return res.status(500).json({ error: 'Failed to fetch contact' });
  }
}

async function updateContact(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      emailStatus,
      customFields,
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(firstName);
      paramIndex++;
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(lastName);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (company !== undefined) {
      updates.push(`company = $${paramIndex}`);
      params.push(company);
      paramIndex++;
    }

    if (emailStatus !== undefined) {
      updates.push(`email_status = $${paramIndex}`);
      params.push(emailStatus);
      paramIndex++;
    }

    if (customFields !== undefined) {
      updates.push(`custom_fields = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(customFields));
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      await prisma.$queryRawUnsafe(
        `UPDATE contacts SET ${updates.join(', ')} WHERE id = $1`,
        ...params
      );
    }

    const contact = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', ct.id, 'name', ct.name, 'color', ct.color))
          FILTER (WHERE ct.id IS NOT NULL),
          '[]'
        ) as tags,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', cl.id, 'name', cl.name))
          FILTER (WHERE cl.id IS NOT NULL),
          '[]'
        ) as lists
      FROM contacts c
      LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
      LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
      LEFT JOIN contact_list_members clm ON c.id = clm.contact_id
      LEFT JOIN contact_lists cl ON clm.list_id = cl.id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;

    return res.status(200).json(contact[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
}

async function deleteContact(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`
      DELETE FROM contacts WHERE id = ${id}
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
}
