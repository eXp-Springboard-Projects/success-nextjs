import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

/**
 * Unified Contacts API
 *
 * Merges contacts from multiple sources:
 * - contacts table (HubSpot imports, CRM contacts)
 * - staff table (team members)
 * - users table (authenticated users)
 *
 * Returns a unified list with consistent schema for use in campaign recipient selectors
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const {
      search = '',
      source = 'all', // 'all', 'contacts', 'staff', 'users'
      status = 'all', // 'all', 'active', 'inactive'
      page = '1',
      per_page = '50',
    } = req.query;

    const pageNum = parseInt(page as string);
    const perPage = parseInt(per_page as string);
    const offset = (pageNum - 1) * perPage;

    interface UnifiedContact {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      fullName: string;
      source: 'contact' | 'staff' | 'user';
      status: string;
      company: string | null;
      phone: string | null;
      tags: string[];
      createdAt: string;
    }

    let allContacts: UnifiedContact[] = [];

    // Fetch from contacts table
    if (source === 'all' || source === 'contacts') {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Reasonable limit for initial fetch

      if (contacts) {
        allContacts.push(...contacts.map(c => ({
          id: c.id,
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          fullName: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email,
          source: 'contact' as const,
          status: c.status || 'active',
          company: c.company,
          phone: c.phone,
          tags: c.tags || [],
          createdAt: c.created_at,
        })));
      }
    }

    // Fetch from staff table
    if (source === 'all' || source === 'staff') {
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (staff) {
        allContacts.push(...staff.map(s => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          fullName: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email,
          source: 'staff' as const,
          status: s.status || 'active',
          company: s.company || null,
          phone: s.phone || null,
          tags: [],
          createdAt: s.created_at,
        })));
      }
    }

    // Fetch from users table
    if (source === 'all' || source === 'users') {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (users) {
        allContacts.push(...users.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.name?.split(' ')[0] || null,
          lastName: u.name?.split(' ').slice(1).join(' ') || null,
          fullName: u.name || u.email,
          source: 'user' as const,
          status: 'active',
          company: null,
          phone: null,
          tags: [],
          createdAt: u.created_at,
        })));
      }
    }

    // Apply search filter
    let filtered = allContacts;
    if (search && typeof search === 'string') {
      const query = search.toLowerCase();
      filtered = allContacts.filter(c =>
        c.email.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query) ||
        c.firstName?.toLowerCase().includes(query) ||
        c.lastName?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Deduplicate by email (prefer staff > user > contact)
    const deduped = new Map<string, UnifiedContact>();
    const sourcePriority = { staff: 3, user: 2, contact: 1 };

    for (const contact of filtered) {
      const existing = deduped.get(contact.email);
      if (!existing || sourcePriority[contact.source] > sourcePriority[existing.source]) {
        deduped.set(contact.email, contact);
      }
    }

    const uniqueContacts = Array.from(deduped.values());

    // Sort by created date (newest first)
    uniqueContacts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const total = uniqueContacts.length;
    const paginated = uniqueContacts.slice(offset, offset + perPage);

    return res.status(200).json({
      contacts: paginated,
      pagination: {
        page: pageNum,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Unified contacts fetch error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch contacts',
    });
  }
}
