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
          SELECT id FROM contacts WHERE email = ${email}
        `;

        if (existing.length > 0) {
          results.skipped++;
          results.errors.push(`Skipped: ${email} already exists`);
          continue;
        }

        const contactId = nanoid();

        // Create contact
        await prisma.$executeRaw`
          INSERT INTO contacts (
            id, email, first_name, last_name, phone, company, source
          ) VALUES (
            ${contactId}, ${email}, ${firstName || null}, ${lastName || null},
            ${phone || null}, ${company || null}, 'import'
          )
        `;

        // Add tags (create tag if doesn't exist, then assign)
        for (const tagName of tags) {
          if (tagName && tagName.trim()) {
            // Create tag if it doesn't exist
            await prisma.$executeRaw`
              INSERT INTO contact_tags (id, name)
              VALUES (${nanoid()}, ${tagName.trim()})
              ON CONFLICT (name) DO NOTHING
            `;

            // Get tag ID
            const tagResult = await prisma.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM contact_tags WHERE name = ${tagName.trim()}
            `;

            if (tagResult.length > 0) {
              await prisma.$executeRaw`
                INSERT INTO contact_tag_assignments (contact_id, tag_id)
                VALUES (${contactId}, ${tagResult[0].id})
                ON CONFLICT DO NOTHING
              `;
            }
          }
        }

        // Add to lists (create list if doesn't exist, then assign)
        for (const listName of lists) {
          if (listName && listName.trim()) {
            // Create list if it doesn't exist
            await prisma.$executeRaw`
              INSERT INTO contact_lists (id, name, type)
              VALUES (${nanoid()}, ${listName.trim()}, 'static')
              ON CONFLICT (name) DO NOTHING
            `;

            // Get list ID
            const listResult = await prisma.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM contact_lists WHERE name = ${listName.trim()}
            `;

            if (listResult.length > 0) {
              await prisma.$executeRaw`
                INSERT INTO contact_list_members (contact_id, list_id)
                VALUES (${contactId}, ${listResult[0].id})
                ON CONFLICT DO NOTHING
              `;
            }
          }
        }

        results.imported++;
      } catch (error) {
        results.errors.push(`Error importing ${contact.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to import contacts' });
  }
}
