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
    // Get contact with tags, lists, and recent activities
    const contact = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.*,
        COALESCE(json_agg(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL), '[]') as tags,
        COALESCE(json_agg(DISTINCT cl.list_name) FILTER (WHERE cl.list_name IS NOT NULL), '[]') as lists
      FROM crm_contacts c
      LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
      LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
      WHERE c.id = ${id}
      GROUP BY c.id
    `;

    if (contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get activities
    const activities = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM crm_contact_activities
      WHERE contact_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Get notes
    const notes = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM crm_contact_notes
      WHERE contact_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Get email sends
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
      status,
      customFields,
      tags,
      lists,
    } = req.body;

    // Update contact fields
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
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
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
        `UPDATE crm_contacts SET ${updates.join(', ')} WHERE id = $1`,
        ...params
      );
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Remove all existing tags
      await prisma.$executeRaw`DELETE FROM crm_contact_tags WHERE contact_id = ${id}`;

      // Add new tags
      for (const tag of tags) {
        await prisma.$executeRaw`
          INSERT INTO crm_contact_tags (id, contact_id, tag)
          VALUES (${nanoid()}, ${id}, ${tag})
          ON CONFLICT (contact_id, tag) DO NOTHING
        `;
      }
    }

    // Update lists if provided
    if (lists !== undefined) {
      // Remove all existing lists
      await prisma.$executeRaw`DELETE FROM crm_contact_lists WHERE contact_id = ${id}`;

      // Add new lists
      for (const listName of lists) {
        await prisma.$executeRaw`
          INSERT INTO crm_contact_lists (id, contact_id, list_name)
          VALUES (${nanoid()}, ${id}, ${listName})
          ON CONFLICT (contact_id, list_name) DO NOTHING
        `;
      }
    }

    // Add activity
    await prisma.$executeRaw`
      INSERT INTO crm_contact_activities (id, contact_id, type, description)
      VALUES (${nanoid()}, ${id}, 'contact_updated', 'Contact information updated')
    `;

    // Fetch updated contact
    const contact = await prisma.$queryRaw<Array<any>>`
      SELECT
        c.*,
        COALESCE(json_agg(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL), '[]') as tags,
        COALESCE(json_agg(DISTINCT cl.list_name) FILTER (WHERE cl.list_name IS NOT NULL), '[]') as lists
      FROM crm_contacts c
      LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
      LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
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
    // Delete contact (cascade will handle tags, lists, activities, notes)
    await prisma.$executeRaw`DELETE FROM crm_contacts WHERE id = ${id}`;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
}
