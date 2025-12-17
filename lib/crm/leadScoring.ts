import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ScoringEvent =
  | 'email_opened'
  | 'email_clicked'
  | 'form_submitted'
  | 'purchase'
  | 'page_visited'
  | 'deal_created'
  | 'ticket_created'
  | 'unsubscribed';

/**
 * Update a contact's lead score based on an event
 */
export async function updateContactScore(contactId: string, event: ScoringEvent, metadata?: any) {
  try {
    // Get active scoring rules for this event type
    const rules = await prisma.lead_scoring_rules.findMany({
      where: {
        eventType: event,
        isActive: true,
      },
    });

    if (rules.length === 0) {
      return null;
    }

    // Calculate total points for this event
    let totalPoints = 0;
    for (const rule of rules) {
      // Check if rule has conditions
      if (rule.condition) {
        // TODO: Implement condition matching logic if needed
        // For now, just add points
        totalPoints += rule.points;
      } else {
        totalPoints += rule.points;
      }
    }

    // Update contact score
    const contact = await prisma.contacts.update({
      where: { id: contactId },
      data: {
        leadScore: {
          increment: totalPoints,
        },
        updatedAt: new Date(),
      },
    });

    return {
      contactId,
      event,
      pointsAdded: totalPoints,
      newScore: contact.leadScore,
    };
  } catch (error) {
    console.error('Error updating contact score:', error);
    return null;
  }
}

/**
 * Recalculate all contact scores from scratch
 * WARNING: This can be slow for large databases
 */
export async function recalculateAllScores() {
  try {
    console.log('Recalculating all lead scores...');

    // Reset all scores to 0
    await prisma.contacts.updateMany({
      data: {
        leadScore: 0,
      },
    });

    // Get all contacts
    const contacts = await prisma.contacts.findMany({
      select: { id: true, email: true },
    });

    let processedCount = 0;

    for (const contact of contacts) {
      // Count email opens
      const emailOpens = await prisma.email_logs.count({
        where: {
          contactId: contact.id,
          openedAt: { not: null },
        },
      });

      // Count email clicks
      const emailClicks = await prisma.email_logs.count({
        where: {
          contactId: contact.id,
          clickedAt: { not: null },
        },
      });

      // Count form submissions
      const formSubmissions = await prisma.form_submissions.count({
        where: { contactId: contact.id },
      });

      // Check if unsubscribed
      const emailPref = await prisma.email_preferences.findUnique({
        where: { email: contact.email },
      });

      // Calculate score
      let score = 0;
      score += emailOpens * 5; // email_opened: 5 points each
      score += emailClicks * 10; // email_clicked: 10 points each
      score += formSubmissions * 20; // form_submitted: 20 points each

      if (emailPref?.unsubscribed) {
        score += -50; // unsubscribed: -50 points
      }

      // Update contact
      await prisma.contacts.update({
        where: { id: contact.id },
        data: {
          leadScore: score,
          updatedAt: new Date(),
        },
      });

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${contacts.length} contacts...`);
      }
    }

    console.log(`Recalculation complete! Processed ${processedCount} contacts.`);
    return { processedCount };
  } catch (error) {
    console.error('Error recalculating scores:', error);
    throw error;
  }
}

/**
 * Get top leads by score
 */
export async function getTopLeads(limit: number = 10) {
  try {
    const topLeads = await prisma.contacts.findMany({
      where: {
        status: 'ACTIVE',
        leadScore: {
          gt: 0,
        },
      },
      orderBy: {
        leadScore: 'desc',
      },
      take: limit,
    });

    return topLeads;
  } catch (error) {
    console.error('Error getting top leads:', error);
    return [];
  }
}

/**
 * Get lead score distribution
 */
export async function getScoreDistribution() {
  try {
    const distribution = await prisma.$queryRaw<Array<{
      range: string;
      count: bigint;
    }>>`
      SELECT
        CASE
          WHEN "leadScore" >= 100 THEN 'Hot (100+)'
          WHEN "leadScore" >= 50 THEN 'Warm (50-99)'
          WHEN "leadScore" >= 20 THEN 'Medium (20-49)'
          WHEN "leadScore" > 0 THEN 'Cold (1-19)'
          ELSE 'None (0)'
        END as range,
        COUNT(*) as count
      FROM contacts
      WHERE status = 'ACTIVE'
      GROUP BY range
      ORDER BY
        CASE range
          WHEN 'Hot (100+)' THEN 1
          WHEN 'Warm (50-99)' THEN 2
          WHEN 'Medium (20-49)' THEN 3
          WHEN 'Cold (1-19)' THEN 4
          ELSE 5
        END
    `;

    return distribution.map(d => ({
      range: d.range,
      count: Number(d.count),
    }));
  } catch (error) {
    console.error('Error getting score distribution:', error);
    return [];
  }
}

/**
 * Get lead score badge color based on score
 */
export function getScoreBadgeColor(score: number): string {
  if (score >= 100) return '#dc3545'; // Hot - Red
  if (score >= 50) return '#fd7e14'; // Warm - Orange
  if (score >= 20) return '#ffc107'; // Medium - Yellow
  if (score > 0) return '#17a2b8'; // Cold - Blue
  return '#6c757d'; // None - Gray
}

/**
 * Get lead score label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 100) return 'Hot';
  if (score >= 50) return 'Warm';
  if (score >= 20) return 'Medium';
  if (score > 0) return 'Cold';
  return 'None';
}
