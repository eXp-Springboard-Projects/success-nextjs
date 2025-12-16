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
    return getContacts(req, res);
  } else if (req.method === 'POST') {
    return createContact(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getContacts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      search = '',
      status = '',
      tag = '',
      list = '',
      page = '1',
      limit = '50',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build WHERE clause
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (
        c.email ILIKE $${paramIndex} OR
        c.first_name ILIKE $${paramIndex} OR
        c.last_name ILIKE $${paramIndex} OR
        c.company ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tag) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM crm_contact_tags ct
        WHERE ct.contact_id = c.id AND ct.tag = $${paramIndex}
      )`;
      params.push(tag);
      paramIndex++;
    }

    if (list) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM crm_contact_lists cl
        WHERE cl.contact_id = c.id AND cl.list_name = $${paramIndex}
      )`;
      params.push(list);
      paramIndex++;
    }

    // Get contacts with tags and lists
    const contacts = await prisma.$queryRawUnsafe(`
      SELECT
        c.*,
        COALESCE(
          json_agg(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL),
          '[]'
        ) as tags,
        COALESCE(
          json_agg(DISTINCT cl.list_name) FILTER (WHERE cl.list_name IS NOT NULL),
          '[]'
        ) as lists,
        (
          SELECT MAX(created_at)
          FROM crm_contact_activities
          WHERE contact_id = c.id
        ) as last_activity
      FROM crm_contacts c
      LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
      LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
      WHERE 1=1 ${whereClause}
      GROUP BY c.id
      ORDER BY c.${sortBy === 'last_activity' ? 'updated_at' : sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, ...params, parseInt(limit as string), offset);

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(DISTINCT c.id) as count
       FROM crm_contacts c
       LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
       LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
       WHERE 1=1 ${whereClause}`,
      ...params
    );

    const total = Number(countResult[0].count);

    return res.status(200).json({
      contacts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ error: 'Failed to fetch contacts' });
  }
}

async function createContact(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      source = 'manual',
      tags = [],
      lists = [],
      customFields = {},
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if contact already exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM crm_contacts WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    const contactId = nanoid();

    // Create contact
    await prisma.$executeRaw`
      INSERT INTO crm_contacts (
        id, email, first_name, last_name, phone, company, source, custom_fields, status
      ) VALUES (
        ${contactId}, ${email}, ${firstName || null}, ${lastName || null},
        ${phone || null}, ${company || null}, ${source}, ${JSON.stringify(customFields)}::jsonb,
        'active'
      )
    `;

    // Add tags
    for (const tag of tags) {
      await prisma.$executeRaw`
        INSERT INTO crm_contact_tags (id, contact_id, tag)
        VALUES (${nanoid()}, ${contactId}, ${tag})
        ON CONFLICT (contact_id, tag) DO NOTHING
      `;
    }

    // Add to lists
    for (const listName of lists) {
      await prisma.$executeRaw`
        INSERT INTO crm_contact_lists (id, contact_id, list_name)
        VALUES (${nanoid()}, ${contactId}, ${listName})
        ON CONFLICT (contact_id, list_name) DO NOTHING
      `;
    }

    // Add activity
    await prisma.$executeRaw`
      INSERT INTO crm_contact_activities (id, contact_id, type, description)
      VALUES (${nanoid()}, ${contactId}, 'contact_created', 'Contact created')
    `;

    // Fetch the created contact with tags and lists
    const contact = await prisma.$queryRaw`
      SELECT
        c.*,
        COALESCE(json_agg(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL), '[]') as tags,
        COALESCE(json_agg(DISTINCT cl.list_name) FILTER (WHERE cl.list_name IS NOT NULL), '[]') as lists
      FROM crm_contacts c
      LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
      LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
      WHERE c.id = ${contactId}
      GROUP BY c.id
    `;

    return res.status(201).json(contact[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
}
