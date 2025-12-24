import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid contact ID' });
  }

  const supabase = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      // Fetch contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (contactError || !contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      // Fetch email logs (last 10)
      const { data: email_logs } = await supabase
        .from('email_logs')
        .select('*')
        .eq('contactId', id)
        .order('sentAt', { ascending: false })
        .limit(10);

      // Fetch campaign contacts with campaign details
      const { data: campaign_contacts } = await supabase
        .from('campaign_contacts')
        .select('*, campaigns(*)')
        .eq('contactId', id);

      const result = {
        ...contact,
        email_logs: email_logs || [],
        campaign_contacts: campaign_contacts || [],
      };

      return res.status(200).json(result);
    }

    if (req.method === 'PUT') {
      const { email, firstName, lastName, phone, company, tags, status, notes } = req.body;

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (company !== undefined) updateData.company = company;
      if (tags !== undefined) updateData.tags = tags;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: 'Failed to update contact' });
      }

      return res.status(200).json(contact);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ message: 'Failed to delete contact' });
      }

      return res.status(200).json({ message: 'Contact deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
