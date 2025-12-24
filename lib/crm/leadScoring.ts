import { supabaseAdmin } from '../supabase';

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
    const supabase = supabaseAdmin();

    // Get active scoring rules for this event type
    const { data: rules, error: rulesError } = await supabase
      .from('lead_scoring_rules')
      .select('*')
      .eq('eventType', event)
      .eq('isActive', true);

    if (rulesError || !rules || rules.length === 0) {
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

    // Get current contact to increment score
    const { data: currentContact } = await supabase
      .from('contacts')
      .select('leadScore')
      .eq('id', contactId)
      .single();

    const currentScore = currentContact?.leadScore || 0;

    // Update contact score
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update({
        leadScore: currentScore + totalPoints,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single();

    if (updateError || !contact) {
      return null;
    }

    return {
      contactId,
      event,
      pointsAdded: totalPoints,
      newScore: contact.leadScore,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Recalculate all contact scores from scratch
 * WARNING: This can be slow for large databases
 */
export async function recalculateAllScores() {
  try {
    const supabase = supabaseAdmin();

    // Reset all scores to 0
    await supabase
      .from('contacts')
      .update({ leadScore: 0 });

    // Get all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email');

    if (contactsError || !contacts) {
      throw new Error('Failed to fetch contacts');
    }

    let processedCount = 0;

    for (const contact of contacts) {
      // Count email opens
      const { count: emailOpens } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('contactId', contact.id)
        .not('openedAt', 'is', null);

      // Count email clicks
      const { count: emailClicks } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('contactId', contact.id)
        .not('clickedAt', 'is', null);

      // Count form submissions
      const { count: formSubmissions } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('contactId', contact.id);

      // Check if unsubscribed
      const { data: emailPref } = await supabase
        .from('email_preferences')
        .select('unsubscribed')
        .eq('email', contact.email)
        .single();

      // Calculate score
      let score = 0;
      score += (emailOpens || 0) * 5; // email_opened: 5 points each
      score += (emailClicks || 0) * 10; // email_clicked: 10 points each
      score += (formSubmissions || 0) * 20; // form_submitted: 20 points each

      if (emailPref?.unsubscribed) {
        score += -50; // unsubscribed: -50 points
      }

      // Update contact
      await supabase
        .from('contacts')
        .update({
          leadScore: score,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', contact.id);

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} contacts...`);
      }
    }

    return { processedCount };
  } catch (error) {
    throw error;
  }
}

/**
 * Get top leads by score
 */
export async function getTopLeads(limit: number = 10) {
  try {
    const supabase = supabaseAdmin();

    const { data: topLeads, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'ACTIVE')
      .gt('leadScore', 0)
      .order('leadScore', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return topLeads || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get lead score distribution
 */
export async function getScoreDistribution() {
  try {
    const supabase = supabaseAdmin();

    // Fetch all active contacts with their lead scores
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('leadScore')
      .eq('status', 'ACTIVE');

    if (error || !contacts) {
      return [];
    }

    // Calculate distribution manually
    const distribution = {
      'Hot (100+)': 0,
      'Warm (50-99)': 0,
      'Medium (20-49)': 0,
      'Cold (1-19)': 0,
      'None (0)': 0,
    };

    contacts.forEach((contact: any) => {
      const score = contact.leadScore || 0;
      if (score >= 100) {
        distribution['Hot (100+)']++;
      } else if (score >= 50) {
        distribution['Warm (50-99)']++;
      } else if (score >= 20) {
        distribution['Medium (20-49)']++;
      } else if (score > 0) {
        distribution['Cold (1-19)']++;
      } else {
        distribution['None (0)']++;
      }
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));
  } catch (error) {
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
