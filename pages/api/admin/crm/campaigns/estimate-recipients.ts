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
    const { lists, exclusions, excludeRecentDays } = req.query;

    const listIds = lists ? String(lists).split(',').filter(Boolean) : [];
    const exclusionIds = exclusions ? String(exclusions).split(',').filter(Boolean) : [];
    const recentDays = parseInt(String(excludeRecentDays)) || 0;

    if (listIds.length === 0) {
      return res.status(200).json({ count: 0 });
    }

    // Get contacts from selected lists
    const listMembers = await prisma.list_members.findMany({
      where: {
        listId: { in: listIds },
      },
      include: {
        contact: true,
      },
    });

    // Get exclusion contacts
    const exclusionMembers = exclusionIds.length > 0
      ? await prisma.list_members.findMany({
          where: { listId: { in: exclusionIds } },
        })
      : [];

    const exclusionContactIds = new Set(exclusionMembers.map(m => m.contactId));

    // Get recently emailed contacts if specified
    let recentContactIds = new Set<string>();
    if (recentDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - recentDays);

      const recentEvents = await prisma.email_events.findMany({
        where: {
          event: 'sent',
          createdAt: { gte: cutoffDate },
        },
      });

      recentContactIds = new Set(recentEvents.map(e => e.contactId));
    }

    // Count valid recipients
    const validContacts = listMembers.filter(member => {
      const contact = member.contact;

      // Skip excluded
      if (exclusionContactIds.has(contact.id)) {
        return false;
      }

      // Skip recently emailed
      if (recentContactIds.has(contact.id)) {
        return false;
      }

      // Skip inactive
      if (contact.status !== 'ACTIVE') {
        return false;
      }

      return true;
    });

    // Get unique contacts (in case they're in multiple lists)
    const uniqueContactIds = new Set(validContacts.map(m => m.contactId));

    // Check unsubscribe status for remaining contacts
    const unsubscribedEmails = await prisma.email_preferences.findMany({
      where: {
        contactId: { in: Array.from(uniqueContactIds) },
        unsubscribed: true,
      },
    });

    const unsubscribedCount = unsubscribedEmails.length;
    const finalCount = uniqueContactIds.size - unsubscribedCount;

    return res.status(200).json({
      count: Math.max(0, finalCount),
      breakdown: {
        totalInLists: listMembers.length,
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
