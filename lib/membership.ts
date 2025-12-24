/**
 * Membership Tier Management
 *
 * Handles COLLECTIVE vs INSIDER tier logic and content gating
 */

import { SubscriptionStatus } from '@/lib/types';
import { supabaseAdmin } from './supabase';

// Membership tier definitions
export enum MembershipTier {
  FREE = 'FREE',
  COLLECTIVE = 'COLLECTIVE',
  INSIDER = 'INSIDER',
}

// Tier features matrix
export const TIER_FEATURES = {
  [MembershipTier.FREE]: {
    name: 'Free',
    price: 0,
    features: [
      '3 free articles per month',
      'Access to public content',
      'Newsletter subscription',
    ],
    limits: {
      articlesPerMonth: 3,
      magazineAccess: false,
      coursesAccess: false,
      livesAccess: false,
      printMagazine: false,
      coaching: false,
    },
  },
  [MembershipTier.COLLECTIVE]: {
    name: 'SUCCESS+ Insider (Legacy)',
    monthlyPrice: 7.99,
    annualPrice: 75,
    features: [
      '6 Print + 6 Digital magazine editions/year',
      'Digital access to each print issue',
      'Exclusive interviews with cover talent',
      'Discounted access to paid courses',
      'Free course library (select titles)',
      'E-books, guides & worksheets',
      'Insider Newsletter (4/month)',
      'Legacy SUCCESS video training',
    ],
    limits: {
      articlesPerMonth: Infinity,
      magazineAccess: true,
      coursesAccess: true,
      livesAccess: false,
      printMagazine: true,
      coaching: false,
    },
  },
  [MembershipTier.INSIDER]: {
    name: 'SUCCESS+ Insider',
    monthlyPrice: 7.99,
    annualPrice: 75,
    features: [
      '6 Print + 6 Digital magazine editions/year',
      'Digital access to each print issue',
      'Exclusive interviews with cover talent',
      'Discounted access to paid courses',
      'Free course library (select titles)',
      'E-books, guides & worksheets',
      'Insider Newsletter (4/month)',
      'Legacy SUCCESS video training',
      'Additional member discounts',
    ],
    limits: {
      articlesPerMonth: Infinity,
      magazineAccess: true,
      coursesAccess: true,
      livesAccess: true,
      printMagazine: true,
      coaching: false,
    },
  },
};

/**
 * Get user's current membership tier
 */
export async function getUserTier(userId: string): Promise<MembershipTier> {
  if (!userId) {
    return MembershipTier.FREE;
  }

  const supabase = supabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      member:members!users_memberId_fkey (
        *,
        subscriptions (*)
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !user) {
    return MembershipTier.FREE;
  }

  // ADMINS AND SUPER_ADMINS GET FULL INSIDER ACCESS
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return MembershipTier.INSIDER;
  }

  if (!user.member?.subscriptions || user.member.subscriptions.length === 0) {
    return MembershipTier.FREE;
  }

  const subscription = user.member.subscriptions[0];

  // Check if subscription is active
  const isActive = subscription.status === 'active';

  if (!isActive) {
    return MembershipTier.FREE;
  }

  // Map subscription tier
  const tierMap: Record<string, MembershipTier> = {
    'COLLECTIVE': MembershipTier.COLLECTIVE,
    'INSIDER': MembershipTier.INSIDER,
    'SUCCESS_PLUS': MembershipTier.COLLECTIVE, // Legacy
  };

  return tierMap[subscription.tier || ''] || MembershipTier.FREE;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof typeof TIER_FEATURES.COLLECTIVE.limits
): Promise<boolean> {
  const tier = await getUserTier(userId);
  const limits = TIER_FEATURES[tier].limits;
  return limits[feature] !== false;
}

/**
 * Check if content is gated (requires subscription)
 */
export function isContentGated(content: {
  categories?: { slug: string }[];
  tags?: { slug: string }[];
  metadata?: any;
}): boolean {
  // SUCCESS+ tagged content is always gated
  const successPlusTags = ['success-plus', 'premium', 'exclusive'];
  const hasPremiumTag = content.tags?.some(tag =>
    successPlusTags.includes(tag.slug.toLowerCase())
  );

  if (hasPremiumTag) {
    return true;
  }

  // Check for premium categories
  const premiumCategories = ['insider', 'exclusive', 'premium'];
  const hasPremiumCategory = content.categories?.some(cat =>
    premiumCategories.includes(cat.slug.toLowerCase())
  );

  return hasPremiumCategory || false;
}

/**
 * Check if user can access specific content
 */
export async function canAccessContent(
  userId: string | null,
  content: {
    categories?: { slug: string }[];
    tags?: { slug: string }[];
    metadata?: any;
    isInsiderOnly?: boolean;
  }
): Promise<{
  canAccess: boolean;
  reason?: string;
  requiredTier?: MembershipTier;
}> {
  // Public content is always accessible
  if (!isContentGated(content) && !content.isInsiderOnly) {
    return { canAccess: true };
  }

  // No user ID means not logged in
  if (!userId) {
    return {
      canAccess: false,
      reason: 'login_required',
      requiredTier: MembershipTier.COLLECTIVE,
    };
  }

  const userTier = await getUserTier(userId);

  // Insider-only content
  if (content.isInsiderOnly) {
    if (userTier === MembershipTier.INSIDER) {
      return { canAccess: true };
    }
    return {
      canAccess: false,
      reason: 'tier_required',
      requiredTier: MembershipTier.INSIDER,
    };
  }

  // SUCCESS+ content (Collective or higher)
  if (userTier === MembershipTier.FREE) {
    // Check article limit for free users
    const hasReachedLimit = await checkArticleLimit(userId);
    if (hasReachedLimit) {
      return {
        canAccess: false,
        reason: 'article_limit_reached',
        requiredTier: MembershipTier.COLLECTIVE,
      };
    }
  }

  // Collective or Insider can access SUCCESS+ content
  if (userTier === MembershipTier.COLLECTIVE || userTier === MembershipTier.INSIDER) {
    return { canAccess: true };
  }

  return {
    canAccess: false,
    reason: 'subscription_required',
    requiredTier: MembershipTier.COLLECTIVE,
  };
}

/**
 * Check if free user has reached article limit
 */
export async function checkArticleLimit(userId: string): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const supabase = supabaseAdmin();

  // Get paywall config
  const { data: config } = await supabase
    .from('paywall_config')
    .select('*')
    .limit(1)
    .single();

  const limit = config?.freeArticleLimit || 3;

  // Count unique article views - Supabase doesn't have groupBy, so we select distinct articleIds
  const { data: uniqueArticles, error } = await supabase
    .from('page_views')
    .select('articleId')
    .eq('userId', userId)
    .gte('viewedAt', startOfMonth.toISOString());

  if (error || !uniqueArticles) {
    return false;
  }

  // Get unique article IDs
  const uniqueArticleIds = new Set(uniqueArticles.map(v => v.articleId));
  const viewCount = uniqueArticleIds.size;

  return viewCount >= limit;
}

/**
 * Get remaining free articles for user
 */
export async function getRemainingFreeArticles(userId: string): Promise<number> {
  const supabase = supabaseAdmin();

  // Get paywall config
  const { data: config } = await supabase
    .from('paywall_config')
    .select('*')
    .limit(1)
    .single();

  const limit = config?.freeArticleLimit || 3;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count unique article views
  const { data: uniqueArticles, error } = await supabase
    .from('page_views')
    .select('articleId')
    .eq('userId', userId)
    .gte('viewedAt', startOfMonth.toISOString());

  if (error || !uniqueArticles) {
    return limit;
  }

  // Get unique article IDs
  const uniqueArticleIds = new Set(uniqueArticles.map(v => v.articleId));
  const viewCount = uniqueArticleIds.size;

  return Math.max(0, limit - viewCount);
}

/**
 * Track article view for paywall limit
 */
export async function trackArticleView(
  userId: string | null,
  article: {
    id: string;
    title: string;
    url: string;
  },
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!userId && !sessionId) return;

  const generateId = () => `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const supabase = supabaseAdmin();
  await supabase.from('page_views').insert({
    id: generateId(),
    userId: userId || null,
    sessionId: sessionId || null,
    articleId: article.id,
    articleTitle: article.title,
    articleUrl: article.url,
    viewedAt: new Date().toISOString(),
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
}

/**
 * Check if user's subscription is active
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      member:members!users_memberId_fkey (
        *,
        subscriptions (*)
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !user || !user.member?.subscriptions || user.member.subscriptions.length === 0) {
    return false;
  }

  const subscription = user.member.subscriptions[0];
  return subscription.status === 'active';
}

/**
 * Get subscription details for display
 */
export async function getSubscriptionDetails(userId: string) {
  const supabase = supabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      member:members!users_memberId_fkey (
        *,
        subscriptions (*)
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !user || !user.member?.subscriptions || user.member.subscriptions.length === 0) {
    return null;
  }

  const subscription = user.member.subscriptions[0];
  const tier = await getUserTier(userId);

  return {
    tier,
    status: subscription.status,
    billingCycle: subscription.billingCycle,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    provider: subscription.provider,
    features: TIER_FEATURES[tier],
  };
}

/**
 * Compare tiers
 */
export function isHigherTier(tier1: MembershipTier, tier2: MembershipTier): boolean {
  const hierarchy = {
    [MembershipTier.FREE]: 0,
    [MembershipTier.COLLECTIVE]: 1,
    [MembershipTier.INSIDER]: 2,
  };

  return hierarchy[tier1] > hierarchy[tier2];
}

export default {
  getUserTier,
  hasFeatureAccess,
  isContentGated,
  canAccessContent,
  checkArticleLimit,
  getRemainingFreeArticles,
  trackArticleView,
  hasActiveSubscription,
  getSubscriptionDetails,
  isHigherTier,
  TIER_FEATURES,
  MembershipTier,
};
