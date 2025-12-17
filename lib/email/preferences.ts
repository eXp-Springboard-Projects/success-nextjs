import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
 * Check if email is allowed for a specific type
 */
export async function checkEmailAllowed(
  email: string,
  type: 'marketing' | 'transactional' | 'newsletter'
): Promise<boolean> {
  const preferences = await prisma.email_preferences.findUnique({
    where: { email },
  });

  if (!preferences) {
    return true; // If no preferences exist, allow by default
  }

  if (preferences.unsubscribed) {
    return false; // Fully unsubscribed
  }

  switch (type) {
    case 'marketing':
      return preferences.optInMarketing ?? false;
    case 'transactional':
      return preferences.optInTransactional ?? false;
    case 'newsletter':
      return preferences.optInNewsletter ?? false;
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
    optInMarketing?: boolean;
    optInNewsletter?: boolean;
    optInTransactional?: boolean;
    unsubscribed?: boolean;
    unsubscribeReason?: string;
  }
) {
  const emailPrefs = await prisma.email_preferences.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!emailPrefs) {
    throw new Error('Invalid token');
  }

  const updateData: any = {
    ...preferences,
    updatedAt: new Date(),
  };

  // If unsubscribing, set timestamp
  if (preferences.unsubscribed && !emailPrefs.unsubscribed) {
    updateData.unsubscribedAt = new Date();
  }

  // If resubscribing, clear timestamp
  if (preferences.unsubscribed === false && emailPrefs.unsubscribed) {
    updateData.unsubscribedAt = null;
  }

  return prisma.email_preferences.update({
    where: { unsubscribeToken: token },
    data: updateData,
  });
}

/**
 * Create or update email preferences for an email
 */
export async function ensureEmailPreferences(email: string, contactId?: string) {
  const existing = await prisma.email_preferences.findUnique({
    where: { email },
  });

  if (existing) {
    return existing;
  }

  const token = generateUnsubscribeToken(email);
  const { v4: uuidv4 } = await import('uuid');

  return prisma.email_preferences.create({
    data: {
      id: uuidv4(),
      email,
      contactId,
      unsubscribeToken: token,
    },
  });
}

/**
 * Get preferences by token
 */
export async function getPreferencesByToken(token: string) {
  return prisma.email_preferences.findUnique({
    where: { unsubscribeToken: token },
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
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
