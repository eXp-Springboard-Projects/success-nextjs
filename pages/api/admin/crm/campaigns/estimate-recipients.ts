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
    const { lists, exclusions, excludeRecentDays } = req.query;

    const listIds = lists ? String(lists).split(',').filter(Boolean) : [];
    const exclusionIds = exclusions ? String(exclusions).split(',').filter(Boolean) : [];
    const recentDays = parseInt(String(excludeRecentDays)) || 0;

    if (listIds.length === 0) {
      return res.status(200).json({ count: 0 });
    }

    // Get contacts from selected lists
    const { data: listMembers, error: listMembersError } = await supabase
      .from('contact_list_members')
      .select('contact_id, contacts(*)')
      .in('list_id', listIds);

    if (listMembersError) {
      return res.status(500).json({ error: 'Failed to fetch list members' });
    }

    // Get exclusion contacts
    let exclusionContactIds = new Set<string>();
    if (exclusionIds.length > 0) {
      const { data: exclusionMembers } = await supabase
        .from('contact_list_members')
        .select('contact_id')
        .in('list_id', exclusionIds);

      if (exclusionMembers) {
        exclusionContactIds = new Set(exclusionMembers.map(m => m.contact_id));
      }
    }

    // Get recently emailed contacts if specified
    let recentContactIds = new Set<string>();
    if (recentDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - recentDays);

      const { data: recentEvents } = await supabase
        .from('email_events')
        .select('contact_id')
        .eq('event', 'sent')
        .gte('created_at', cutoffDate.toISOString());

      if (recentEvents) {
        recentContactIds = new Set(recentEvents.map(e => e.contact_id));
      }
    }

    // Count valid recipients
    const validContacts = listMembers?.filter((member: any) => {
      const contact = member.contacts;

      // Skip excluded
      if (exclusionContactIds.has(contact?.id)) {
        return false;
      }

      // Skip recently emailed
      if (recentContactIds.has(contact?.id)) {
        return false;
      }

      // Skip inactive
      if (contact?.status !== 'ACTIVE') {
        return false;
      }

      return true;
    }) || [];

    // Get unique contacts (in case they're in multiple lists)
    const uniqueContactIds = new Set(validContacts.map(m => m.contact_id));

    // Check unsubscribe status for remaining contacts
    const { data: unsubscribedEmails } = await supabase
      .from('email_preferences')
      .select('contact_id')
      .in('contact_id', Array.from(uniqueContactIds))
      .eq('unsubscribed', true);

    const unsubscribedCount = unsubscribedEmails?.length || 0;
    const finalCount = uniqueContactIds.size - unsubscribedCount;

    return res.status(200).json({
      count: Math.max(0, finalCount),
      breakdown: {
        totalInLists: listMembers?.length || 0,
        uniqueContacts: uniqueContactIds.size,
        excluded: exclusionContactIds.size,
        recentlyEmailed: recentContactIds.size,
        unsubscribed: unsubscribedCount,
        final: Math.max(0, finalCount),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to estimate recipients' });
  }
}
