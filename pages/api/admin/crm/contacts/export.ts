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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format = 'csv', ids = '' } = req.query;

    let whereClause = '';
    if (ids && typeof ids === 'string') {
      const idArray = ids.split(',');
      whereClause = `WHERE c.id = ANY($1::text[])`;
    }

    // Fetch contacts with tags and lists
    const contacts = ids && typeof ids === 'string'
      ? await prisma.$queryRaw<Array<any>>`
          SELECT
            c.id, c.email, c.first_name, c.last_name, c.phone, c.company,
            c.status, c.email_status, c.source, c.created_at,
            COALESCE(string_agg(DISTINCT ct.tag, '; '), '') as tags,
            COALESCE(string_agg(DISTINCT cl.list_name, '; '), '') as lists,
            c.total_emails_sent, c.total_opens, c.total_clicks
          FROM crm_contacts c
          LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
          LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
          WHERE c.id = ANY(${ids.split(',')})
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `
      : await prisma.$queryRaw<Array<any>>`
          SELECT
            c.id, c.email, c.first_name, c.last_name, c.phone, c.company,
            c.status, c.email_status, c.source, c.created_at,
            COALESCE(string_agg(DISTINCT ct.tag, '; '), '') as tags,
            COALESCE(string_agg(DISTINCT cl.list_name, '; '), '') as lists,
            c.total_emails_sent, c.total_opens, c.total_clicks
          FROM crm_contacts c
          LEFT JOIN crm_contact_tags ct ON c.id = ct.contact_id
          LEFT JOIN crm_contact_lists cl ON c.id = cl.contact_id
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `;

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID', 'Email', 'First Name', 'Last Name', 'Phone', 'Company',
        'Status', 'Email Status', 'Source', 'Tags', 'Lists',
        'Total Emails Sent', 'Total Opens', 'Total Clicks', 'Created At'
      ];

      const csvRows = [headers.join(',')];

      for (const contact of contacts) {
        const row = [
          contact.id,
          contact.email,
          contact.first_name || '',
          contact.last_name || '',
          contact.phone || '',
          contact.company || '',
          contact.status,
          contact.email_status || '',
          contact.source || '',
          `"${contact.tags || ''}"`,
          `"${contact.lists || ''}"`,
          contact.total_emails_sent || 0,
          contact.total_opens || 0,
          contact.total_clicks || 0,
          new Date(contact.created_at).toISOString(),
        ];
        csvRows.push(row.join(','));
      }

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=contacts-${Date.now()}.csv`);
      return res.status(200).send(csv);
    } else {
      // Return JSON
      return res.status(200).json({ contacts });
    }
  } catch (error) {
    console.error('Error exporting contacts:', error);
    return res.status(500).json({ error: 'Failed to export contacts' });
  }
}
