import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

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
    const supabase = supabaseAdmin();

    // Get contact with tags and lists
    const { data: contact, error: contactError } = await supabase
      .rpc('get_contact_with_relations', { contact_id: id });

    if (contactError || !contact || contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get activities
    const { data: activities } = await supabase
      .from('contact_activities')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get notes
    const { data: notes } = await supabase
      .from('contact_notes')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get email sends
    const { data: emailSends } = await supabase
      .from('email_sends')
      .select('*')
      .eq('contact_id', id)
      .order('sent_at', { ascending: false })
      .limit(20);

    return res.status(200).json({
      ...contact[0],
      activities: activities || [],
      notes: notes || [],
      emailSends: emailSends || [],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch contact' });
  }
}

async function updateContact(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      emailStatus,
      customFields,
    } = req.body;

    const updates: any = {};

    if (email !== undefined) updates.email = email;
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (company !== undefined) updates.company = company;
    if (emailStatus !== undefined) updates.email_status = emailStatus;
    if (customFields !== undefined) updates.custom_fields = customFields;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Get updated contact with relations
    const { data: contact, error: contactError } = await supabase
      .rpc('get_contact_with_relations', { contact_id: id });

    if (contactError || !contact || contact.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    return res.status(200).json(contact[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update contact' });
  }
}

async function deleteContact(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
}
