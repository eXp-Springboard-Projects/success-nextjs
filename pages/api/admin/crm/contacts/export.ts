import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const { format = 'csv', ids = '' } = req.query;

    // Use RPC function for complex aggregation query
    const { data: contacts, error } = ids && typeof ids === 'string'
      ? await supabase.rpc('export_contacts_with_relations', {
          contact_ids: ids.split(',')
        })
      : await supabase.rpc('export_contacts_with_relations', {
          contact_ids: null
        });

    if (error) {
      // Fallback to basic query if RPC doesn't exist
      const contactsQuery = ids && typeof ids === 'string'
        ? supabase
            .from('contacts')
            .select('*')
            .in('id', ids.split(','))
            .order('created_at', { ascending: false })
        : supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

      const { data: basicContacts, error: basicError } = await contactsQuery;

      if (basicError) {
        throw basicError;
      }

      // Transform basic contacts to expected format
      const formattedContacts = basicContacts?.map((c: any) => ({
        id: c.id,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        company: c.company,
        email_status: c.email_status,
        source: c.source,
        created_at: c.created_at,
        tags: '',
        lists: '',
        total_emails_sent: c.total_emails_sent || 0,
        total_opens: c.total_opens || 0,
        total_clicks: c.total_clicks || 0,
      })) || [];

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

        const rows = formattedContacts.map((c: any) => [
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

      return res.status(200).json(formattedContacts);
    }

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
