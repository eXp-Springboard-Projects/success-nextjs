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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const contact of contacts) {
      try {
        const { email, firstName, lastName, phone, company, tags = [], lists = [] } = contact;

        if (!email) {
          results.skipped++;
          results.errors.push(`Skipped: missing email`);
          continue;
        }

        // Check if contact exists
        const existing = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM crm_contacts WHERE email = ${email}
        `;

        if (existing.length > 0) {
          results.skipped++;
          results.errors.push(`Skipped: ${email} already exists`);
          continue;
        }

        const contactId = nanoid();

        // Create contact
        await prisma.$executeRaw`
          INSERT INTO crm_contacts (
            id, email, first_name, last_name, phone, company, source, status
          ) VALUES (
            ${contactId}, ${email}, ${firstName || null}, ${lastName || null},
            ${phone || null}, ${company || null}, 'import', 'active'
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

        results.imported++;
      } catch (error) {
        results.errors.push(`Error importing ${contact.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error importing contacts:', error);
    return res.status(500).json({ error: 'Failed to import contacts' });
  }
}
