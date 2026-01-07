import crypto from 'crypto';
import { supabaseAdmin } from '../supabase';

/**
 * Generate a secure unsubscribe token
 */
export function generateUnsubscribeToken(email: string): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(`${email}:${timestamp}:${random}`)
    .digest('hex');
  return hash;
}

/**
 * Get unsubscribe URL for an email
 */
export function getUnsubscribeUrl(email: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe/${token}`;
}

/**
 * Email subscription types matching HubSpot replacement
 */
export type EmailSubscriptionType =
  | 'inside_success'       // Stay informed with curated articles, trends, tips, and expert insights
  | 'customer_service'     // Feedback requests and customer service information
  | 'transactional'        // Account signup, purchase receipts, invoices, password changes (always allowed)
  | 'success_updates'      // Latest opportunities, events, webinars, courses, resources
  | 'one_to_one';          // Direct one-to-one emails

/**
 * Check if email is allowed for a specific type
 */
export async function checkEmailAllowed(
  email: string,
  type: EmailSubscriptionType
): Promise<boolean> {
  const supabase = supabaseAdmin();

  const { data: preferences, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !preferences) {
    return true; // If no preferences exist, allow by default
  }

  if (preferences.unsubscribed) {
    // Transactional emails can always be sent regardless of unsubscribe status
    return type === 'transactional';
  }

  switch (type) {
    case 'inside_success':
      return preferences.optInInsideSuccess ?? true;
    case 'customer_service':
      return preferences.optInCustomerService ?? true;
    case 'transactional':
      return true; // Always allowed - relationship-based
    case 'success_updates':
      return preferences.optInSuccessUpdates ?? true;
    case 'one_to_one':
      return preferences.optInOneToOne ?? true;
    default:
      return false;
  }
}

/**
 * Update email preferences
 */
export async function updatePreferences(
  token: string,
  preferences: {
    optInInsideSuccess?: boolean;
    optInCustomerService?: boolean;
    optInSuccessUpdates?: boolean;
    optInOneToOne?: boolean;
    unsubscribed?: boolean;
    unsubscribeReason?: string;
  }
) {
  const supabase = supabaseAdmin();

  const { data: emailPrefs, error: fetchError } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('unsubscribeToken', token)
    .single();

  if (fetchError || !emailPrefs) {
    throw new Error('Invalid token');
  }

  const updateData: any = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  };

  // If unsubscribing, set timestamp
  if (preferences.unsubscribed && !emailPrefs.unsubscribed) {
    updateData.unsubscribedAt = new Date().toISOString();
  }

  // If resubscribing, clear timestamp
  if (preferences.unsubscribed === false && emailPrefs.unsubscribed) {
    updateData.unsubscribedAt = null;
  }

  const { data, error } = await supabase
    .from('email_preferences')
    .update(updateData)
    .eq('unsubscribeToken', token)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update preferences');
  }

  return data;
}

/**
 * Create or update email preferences for an email
 */
export async function ensureEmailPreferences(email: string, contactId?: string) {
  const supabase = supabaseAdmin();

  const { data: existing, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('email', email)
    .single();

  if (existing && !error) {
    return existing;
  }

  const token = generateUnsubscribeToken(email);
  const { v4: uuidv4 } = await import('uuid');

  const { data, error: createError } = await supabase
    .from('email_preferences')
    .insert({
      id: uuidv4(),
      email,
      contactId,
      unsubscribeToken: token,
    })
    .select()
    .single();

  if (createError) {
    throw new Error('Failed to create email preferences');
  }

  return data;
}

/**
 * Get preferences by token
 */
export async function getPreferencesByToken(token: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('email_preferences')
    .select(`
      *,
      contact:contacts!email_preferences_contactId_fkey (
        firstName,
        lastName
      )
    `)
    .eq('unsubscribeToken', token)
    .single();

  return error ? null : data;
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '*'.repeat(local.length - 1);
  return `${maskedLocal}@${domain}`;
}
