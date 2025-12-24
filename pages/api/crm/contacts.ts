import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  try {
    if (req.method === 'GET') {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        return res.status(500).json({ message: 'Failed to fetch contacts' });
      }

      return res.status(200).json(contacts || []);
    }

    if (req.method === 'POST') {
      const { email, firstName, lastName, phone, company, tags, source } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', email)
        .single();

      if (existingContact) {
        return res.status(400).json({ message: 'Contact with this email already exists' });
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          id: randomUUID(),
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          company: company || null,
          tags: tags || [],
          source: source || 'manual',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ message: 'Failed to create contact' });
      }

      return res.status(201).json(contact);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
