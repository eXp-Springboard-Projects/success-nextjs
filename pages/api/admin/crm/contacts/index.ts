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
    const supabase = supabaseAdmin();
    const query = req.query;
    const search = (query.search as string) || '';
    const emailStatus = (query.emailStatus as string) || '';
    const source = (query.source as string) || '';
    const page = parseInt((query.page as string) || '1');
    const limit = parseInt((query.limit as string) || '50');
    const sortBy = (query.sortBy as string) || 'created_at';
    const sortOrder = (query.sortOrder as string) || 'desc';

    const offset = (page - 1) * limit;

    // Build query using Supabase
    let contactsQuery = supabase.from('contacts').select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      contactsQuery = contactsQuery.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    // Apply email status filter
    if (emailStatus) {
      contactsQuery = contactsQuery.eq('email_status', emailStatus);
    }

    // Apply source filter
    if (source) {
      contactsQuery = contactsQuery.eq('source', source);
    }

    // Apply sorting and pagination
    contactsQuery = contactsQuery
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await contactsQuery;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      contacts: contacts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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
    const supabase = supabaseAdmin();
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

    // Check if contact already exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    const contactId = nanoid();

    // Insert contact
    const { error: contactError } = await supabase
      .from('contacts')
      .insert({
        id: contactId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        company: company || null,
        source,
        custom_fields: customFields,
      });

    if (contactError) {
      throw contactError;
    }

    // Insert tag assignments
    if (tagIds.length > 0) {
      const tagAssignments = tagIds.map((tagId: string) => ({
        contact_id: contactId,
        tag_id: tagId,
      }));
      await supabase.from('contact_tag_assignments').insert(tagAssignments);
    }

    // Insert list memberships
    if (listIds.length > 0) {
      const listMemberships = listIds.map((listId: string) => ({
        contact_id: contactId,
        list_id: listId,
      }));
      await supabase.from('contact_list_members').insert(listMemberships);
    }

    // Insert activity
    await supabase.from('contact_activities').insert({
      id: nanoid(),
      contact_id: contactId,
      type: 'contact_created',
      description: 'Contact created',
    });

    // Fetch the complete contact with tags and lists using RPC or raw SQL
    const { data: contact } = await supabase.rpc('get_contact_with_relations', {
      contact_id: contactId,
    });

    // Fallback if RPC doesn't exist - fetch contact separately
    if (!contact) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      const { data: tags } = await supabase
        .from('contact_tag_assignments')
        .select('tag_id, contact_tags(id, name, color)')
        .eq('contact_id', contactId);

      const { data: lists } = await supabase
        .from('contact_list_members')
        .select('list_id, contact_lists(id, name)')
        .eq('contact_id', contactId);

      return res.status(201).json({
        ...contactData,
        tags: tags?.map((t: any) => t.contact_tags).filter(Boolean) || [],
        lists: lists?.map((l: any) => l.contact_lists).filter(Boolean) || [],
      });
    }

    return res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
}
