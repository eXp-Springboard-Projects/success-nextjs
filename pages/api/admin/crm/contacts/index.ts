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
    const query = req.query;
    const search = (query.search as string) || '';
    const emailStatus = (query.emailStatus as string) || '';
    const source = (query.source as string) || '';
    const page = parseInt((query.page as string) || '1');
    const limit = parseInt((query.limit as string) || '50');
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as string) || 'desc';

    const offset = (page - 1) * limit;

    // Build where clause using Prisma
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (emailStatus) {
      where.emailStatus = emailStatus;
    }

    if (source) {
      where.source = source;
    }

    // Fetch contacts using Prisma
    const [contacts, total] = await Promise.all([
      prisma.contacts.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.contacts.count({ where }),
    ]);

    return res.status(200).json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
      tagIds = [],
      listIds = [],
      customFields = {},
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM contacts WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    const contactId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO contacts (
        id, email, first_name, last_name, phone, company, source, custom_fields
      ) VALUES (
        ${contactId}, ${email}, ${firstName || null}, ${lastName || null},
        ${phone || null}, ${company || null}, ${source}, ${JSON.stringify(customFields)}::jsonb
      )
    `;

    for (const tagId of tagIds) {
      await prisma.$executeRaw`
        INSERT INTO contact_tag_assignments (contact_id, tag_id)
        VALUES (${contactId}, ${tagId})
        ON CONFLICT DO NOTHING
      `;
    }

    for (const listId of listIds) {
      await prisma.$executeRaw`
        INSERT INTO contact_list_members (contact_id, list_id)
        VALUES (${contactId}, ${listId})
        ON CONFLICT DO NOTHING
      `;
    }

    await prisma.$executeRaw`
      INSERT INTO contact_activities (id, contact_id, type, description)
      VALUES (${nanoid()}, ${contactId}, 'contact_created', 'Contact created')
    `;

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
      WHERE c.id = ${contactId}
      GROUP BY c.id
    `;

    return res.status(201).json(contact[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create contact' });
  }
}
