import { supabaseAdmin } from './supabase';

export interface TrialAccessResult {
  hasAccess: boolean;
  reason?: 'active_subscription' | 'active_trial' | 'trial_expired' | 'no_access';
  trialEndsAt?: Date | null;
  daysRemaining?: number;
}

/**
 * Check if a user has access to premium content based on subscription or trial status
 * @param userEmail - The user's email address
 * @returns TrialAccessResult indicating whether the user has access
 */
export async function checkTrialAccess(userEmail: string): Promise<TrialAccessResult> {
  try {
    const supabase = supabaseAdmin();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        member:members (
          membershipTier,
          membershipStatus,
          trialEndsAt,
          subscriptions!inner (
            status,
            currentPeriodEnd
          )
        )
      `)
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return {
        hasAccess: false,
        reason: 'no_access',
      };
    }

    const member = user.member;

    // Check if user has active paid subscription
    if (member?.subscriptions && Array.isArray(member.subscriptions) && member.subscriptions.length > 0) {
      const subscription = member.subscriptions[0];

      if (subscription.status === 'ACTIVE') {
        return {
          hasAccess: true,
          reason: 'active_subscription',
        };
      }

      if (subscription.status === 'TRIALING' && subscription.currentPeriodEnd) {
        const now = new Date();
        const trialEnd = new Date(subscription.currentPeriodEnd);

        if (trialEnd > now) {
          const diffTime = trialEnd.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            hasAccess: true,
            reason: 'active_trial',
            trialEndsAt: trialEnd,
            daysRemaining,
          };
        } else {
          return {
            hasAccess: false,
            reason: 'trial_expired',
            trialEndsAt: trialEnd,
            daysRemaining: 0,
          };
        }
      }
    }

    // Check member trial status directly
    if (member?.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(member.trialEndsAt);

      if (trialEnd > now) {
        const diffTime = trialEnd.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          hasAccess: true,
          reason: 'active_trial',
          trialEndsAt: trialEnd,
          daysRemaining,
        };
      } else {
        return {
          hasAccess: false,
          reason: 'trial_expired',
          trialEndsAt: trialEnd,
          daysRemaining: 0,
        };
      }
    }

    // Check for paid membership tiers
    if (
      member?.membershipTier === 'SUCCESSPlus' ||
      member?.membershipTier === 'VIP' ||
      member?.membershipTier === 'Enterprise'
    ) {
      return {
        hasAccess: true,
        reason: 'active_subscription',
      };
    }

    return {
      hasAccess: false,
      reason: 'no_access',
    };
  } catch (error) {
    return {
      hasAccess: false,
      reason: 'no_access',
    };
  }
}
