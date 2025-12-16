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

    const contacts = ids && typeof ids === 'string'
      ? await prisma.$queryRaw<Array<any>>`
          SELECT
            c.id, c.email, c.first_name, c.last_name, c.phone, c.company,
            c.email_status, c.source, c.created_at,
            COALESCE(string_agg(DISTINCT ct.name, '; '), '') as tags,
            COALESCE(string_agg(DISTINCT cl.name, '; '), '') as lists,
            c.total_emails_sent, c.total_opens, c.total_clicks
          FROM contacts c
          LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
          LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
          LEFT JOIN contact_list_members clm ON c.id = clm.contact_id
          LEFT JOIN contact_lists cl ON clm.list_id = cl.id
          WHERE c.id = ANY(${ids.split(',')})
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `
      : await prisma.$queryRaw<Array<any>>`
          SELECT
            c.id, c.email, c.first_name, c.last_name, c.phone, c.company,
            c.email_status, c.source, c.created_at,
            COALESCE(string_agg(DISTINCT ct.name, '; '), '') as tags,
            COALESCE(string_agg(DISTINCT cl.name, '; '), '') as lists,
            c.total_emails_sent, c.total_opens, c.total_clicks
          FROM contacts c
          LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
          LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
          LEFT JOIN contact_list_members clm ON c.id = clm.contact_id
          LEFT JOIN contact_lists cl ON clm.list_id = cl.id
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `;

    if (format === 'csv') {
      const headers = [
        'Email',
        'First Name',
        'Last Name',
        'Phone',
        'Company',
        'Status',
        'Source',
        'Tags',
        'Lists',
        'Emails Sent',
        'Opens',
        'Clicks',
        'Created At',
      ];

      const rows = contacts.map((c: any) => [
        c.email,
        c.first_name || '',
        c.last_name || '',
        c.phone || '',
        c.company || '',
        c.email_status,
        c.source || '',
        c.tags || '',
        c.lists || '',
        c.total_emails_sent || 0,
        c.total_opens || 0,
        c.total_clicks || 0,
        new Date(c.created_at).toISOString(),
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=contacts-${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    return res.status(200).json(contacts);
  } catch (error) {
    console.error('Error exporting contacts:', error);
    return res.status(500).json({ error: 'Failed to export contacts' });
  }
}
