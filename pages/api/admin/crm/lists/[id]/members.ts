import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', perPage = '20', search = '', export: exportCsv } = req.query;
      const pageNum = parseInt(page as string, 10);
      const perPageNum = parseInt(perPage as string, 10);
      const from = (pageNum - 1) * perPageNum;
      const to = from + perPageNum - 1;

      // Build the query
      let query = supabase
        .from('list_members')
        .select(`
          addedAt,
          contact:contacts (
            id,
            email,
            firstName,
            lastName,
            status
          )
        `, { count: 'exact' })
        .eq('listId', id);

      // Add search filter if provided
      if (search) {
        query = query.or(
          `email.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%`,
          { foreignTable: 'contacts' }
        );
      }

      // Apply pagination and ordering
      if (!exportCsv) {
        query = query.range(from, to);
      }
      query = query.order('addedAt', { ascending: false });

      const { data: members, count, error } = await query;

      if (error) throw error;

      // Export CSV
      if (exportCsv) {
        const csv = [
          'Email,First Name,Last Name,Status,Added Date',
          ...(members || []).map((m: any) => {
            const contact = m.contact;
            return `${contact.email},${contact.firstName || ''},${contact.lastName || ''},${contact.status},${new Date(m.addedAt).toISOString()}`;
          }),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
        return res.status(200).send(csv);
      }

      const formattedMembers = (members || []).map((m: any) => ({
        id: m.contact.id,
        email: m.contact.email,
        firstName: m.contact.firstName,
        lastName: m.contact.lastName,
        status: m.contact.status,
        addedAt: m.addedAt,
      }));

      return res.status(200).json({
        members: formattedMembers,
        total: count || 0,
        page: pageNum,
        perPage: perPageNum,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch members' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find contact by email
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email)
        .single();

      if (contactError || !contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Check if already in list
      const { data: existing } = await supabase
        .from('list_members')
        .select('id')
        .eq('listId', id)
        .eq('contactId', contact.id)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Contact already in list' });
      }

      // Add to list
      const { error: insertError } = await supabase
        .from('list_members')
        .insert({
          id: uuidv4(),
          listId: id,
          contactId: contact.id,
        });

      if (insertError) throw insertError;

      // Get current member count
      const { data: currentList } = await supabase
        .from('contact_lists')
        .select('memberCount')
        .eq('id', id)
        .single();

      // Update member count
      const { error: updateError } = await supabase
        .from('contact_lists')
        .update({
          memberCount: (currentList?.memberCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
