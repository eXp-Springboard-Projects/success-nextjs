import { prisma } from './prisma';

/**
 * Membership tier hierarchy (higher = more access)
 */
export enum MembershipLevel {
  FREE = 0,
  COLLECTIVE = 1,
  INSIDER = 2,
}

export const TIER_MAP: Record<string, MembershipLevel> = {
  'FREE': MembershipLevel.FREE,
  'Free': MembershipLevel.FREE,
  'free': MembershipLevel.FREE,
  'COLLECTIVE': MembershipLevel.COLLECTIVE,
  'Collective': MembershipLevel.COLLECTIVE,
  'collective': MembershipLevel.COLLECTIVE,
  'INSIDER': MembershipLevel.INSIDER,
  'Insider': MembershipLevel.INSIDER,
  'insider': MembershipLevel.INSIDER,
};

/**
 * User session type from NextAuth
 */
export interface AccessUser {
  id: string;
  email: string;
  membershipTier?: string;
}

/**
 * Content access requirements
 */
export interface ContentAccess {
  isPremium: boolean;
  requiredTier?: 'collective' | 'insider';
}

/**
 * Active subscription status
 */
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  tier: string;
  provider: 'stripe' | 'paykickstart' | null;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Check if user has an active subscription (Stripe or PayKickstart)
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionStatus> {
  try {
    // Check for active Stripe subscription
    const stripeSubscriptions = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        tier,
        "stripeSubscriptionId" as "subscriptionId",
        "currentPeriodEnd",
        "cancelAtPeriodEnd",
        status
      FROM subscriptions
      WHERE "userId" = ${userId}
        AND status IN ('active', 'trialing')
        AND "currentPeriodEnd" > NOW()
      ORDER BY "currentPeriodEnd" DESC
      LIMIT 1
    `;

    if (stripeSubscriptions.length > 0) {
      const sub = stripeSubscriptions[0];
      return {
        hasActiveSubscription: true,
        tier: sub.tier.toLowerCase(),
        provider: 'stripe',
        subscriptionId: sub.subscriptionId,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
      };
    }

    // Check for active PayKickstart subscription
    // PayKickstart subscriptions are tracked via members.paykickstartCustomerId
    const member = await prisma.$queryRaw<any[]>`
      SELECT
        "membershipTier",
        "membershipStatus",
        "paykickstartCustomerId"
      FROM members
      WHERE id = (SELECT "memberId" FROM users WHERE id = ${userId})
        AND "membershipStatus" = 'Active'
        AND "paykickstartCustomerId" IS NOT NULL
      LIMIT 1
    `;

    if (member.length > 0 && member[0].paykickstartCustomerId) {
      return {
        hasActiveSubscription: true,
        tier: member[0].membershipTier.toLowerCase(),
        provider: 'paykickstart',
        subscriptionId: member[0].paykickstartCustomerId,
        currentPeriodEnd: null, // PayKickstart doesn't expose period end
        cancelAtPeriodEnd: false,
      };
    }

    // No active subscription found
    return {
      hasActiveSubscription: false,
      tier: 'free',
      provider: null,
      subscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  } catch (error) {
    return {
      hasActiveSubscription: false,
      tier: 'free',
      provider: null,
      subscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
}

/**
 * Check if user can access premium content
 */
export async function canAccessContent(
  user: AccessUser | null | undefined,
  content: ContentAccess
): Promise<boolean> {
  // Public content - everyone can access
  if (!content.isPremium) {
    return true;
  }

  // Premium content requires authentication
  if (!user || !user.id) {
    return false;
  }

  // Check for active subscription
  const subscription = await getActiveSubscription(user.id);

  if (!subscription.hasActiveSubscription) {
    return false;
  }

  // Determine user's membership level
  const userLevel = TIER_MAP[subscription.tier] || MembershipLevel.FREE;

  // Determine required level for content
  const requiredLevel = content.requiredTier
    ? TIER_MAP[content.requiredTier] || MembershipLevel.COLLECTIVE
    : MembershipLevel.COLLECTIVE; // Default to Collective for premium content

  // User's tier must meet or exceed required tier
  return userLevel >= requiredLevel;
}

/**
 * Check if user can access magazine content (requires Insider tier)
 */
export async function canAccessMagazine(user: AccessUser | null | undefined): Promise<boolean> {
  if (!user || !user.id) {
    return false;
  }

  const subscription = await getActiveSubscription(user.id);

  if (!subscription.hasActiveSubscription) {
    return false;
  }

  // Only Insider tier gets magazine access
  const userLevel = TIER_MAP[subscription.tier] || MembershipLevel.FREE;
  return userLevel >= MembershipLevel.INSIDER;
}

/**
 * Get user's current subscription tier as string
 */
export function getUserTier(user: AccessUser | null | undefined): string {
  if (!user) return 'free';
  return (user.membershipTier || 'free').toLowerCase();
}

/**
 * Check if route requires premium access
 */
export function isPremiumRoute(pathname: string): boolean {
  const premiumRoutes = [
    '/magazine',
    '/premium',
    '/insider',
    '/courses',
    '/videos/premium',
  ];

  return premiumRoutes.some(route => pathname.startsWith(route));
}

/**
 * Get upgrade URL based on current tier and desired content
 */
export function getUpgradeUrl(requiredTier: 'collective' | 'insider' = 'collective'): string {
  return `/subscribe?tier=${requiredTier}`;
}

/**
 * Format tier name for display
 */
export function formatTierName(tier: string): string {
  const tierMap: Record<string, string> = {
    'free': 'Free',
    'collective': 'SUCCESS+ Collective',
    'insider': 'SUCCESS+ Insider',
  };

  return tierMap[tier.toLowerCase()] || 'Free';
}

/**
 * Get tier benefits for display
 */
export function getTierBenefits(tier: 'free' | 'collective' | 'insider'): string[] {
  const benefits: Record<string, string[]> = {
    free: [
      'Access to free articles',
      'Weekly newsletter',
      'Limited content library',
    ],
    collective: [
      'All FREE benefits',
      'Unlimited premium articles',
      'Exclusive video content',
      'Digital magazine access',
      'Member-only events',
      'Ad-free experience',
    ],
    insider: [
      'All COLLECTIVE benefits',
      'Print magazine subscription (6 issues/year)',
      'Early access to new features',
      'Priority customer support',
      'Exclusive interviews & bonus content',
      'Annual SUCCESS Summit access',
    ],
  };

  return benefits[tier] || benefits.free;
}

/**
 * Get tier pricing
 */
export function getTierPricing(tier: 'collective' | 'insider', billingCycle: 'monthly' | 'annual'): number {
  const pricing: Record<string, Record<string, number>> = {
    collective: {
      monthly: 9.99,
      annual: 99,
    },
    insider: {
      monthly: 14.99,
      annual: 149,
    },
  };

  return pricing[tier][billingCycle];
}
