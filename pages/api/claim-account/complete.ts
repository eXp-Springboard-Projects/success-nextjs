import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with this claim token
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('resetToken', token)
      .gte('resetTokenExpiry', new Date().toISOString())
      .limit(1);

    if (userError) throw userError;

    const user = users?.[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check if already claimed
    if (user.password && user.password !== '') {
      return res.status(400).json({ error: 'This account has already been claimed' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let stripeCustomerId: string | null = null;
    let membershipTier: 'Free' | 'SUCCESSPlus' = 'Free';

    // Get Stripe customer and subscription info (only if Stripe is configured)
    if (stripe) {
      const stripeCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (stripeCustomers.data.length > 0) {
        const stripeCustomer = stripeCustomers.data[0];
        stripeCustomerId = stripeCustomer.id;

        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomer.id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          membershipTier = 'SUCCESSPlus';
        }
      }
    }

    // Create or get member record
    const { data: existingMembers, error: memberFindError } = await supabase
      .from('members')
      .select('*')
      .eq('email', user.email)
      .limit(1);

    if (memberFindError) throw memberFindError;

    let member = existingMembers?.[0];

    if (!member) {
      // Create new member
      const [firstName, ...lastNameParts] = user.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const { data: newMember, error: memberCreateError } = await supabase
        .from('members')
        .insert({
          id: nanoid(),
          firstName,
          lastName,
          email: user.email,
          phone: null,
          membershipTier,
          membershipStatus: 'Active',
          stripeCustomerId,
          totalSpent: 0,
          lifetimeValue: 0,
          engagementScore: 0,
          tags: ['claimed-account'],
          priorityLevel: 'Standard',
        })
        .select()
        .single();

      if (memberCreateError) throw memberCreateError;
      member = newMember;
    }

    // Update user with password and link to member
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        resetToken: null, // Clear claim token
        resetTokenExpiry: null,
        emailVerified: true,
        memberId: member.id,
        hasChangedDefaultPassword: true,
      })
      .eq('id', user.id);

    if (userUpdateError) throw userUpdateError;

    // If there's an active Stripe subscription, create subscription record
    if (stripe && stripeCustomerId && membershipTier === 'SUCCESSPlus') {
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (stripeSubscriptions.data.length > 0) {
        const stripeSub = stripeSubscriptions.data[0];

        // Check if subscription already exists
        const { data: existingSubs, error: subFindError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripeSubscriptionId', stripeSub.id)
          .limit(1);

        if (subFindError) throw subFindError;

        if (!existingSubs || existingSubs.length === 0) {
          // Extract subscription data with proper type handling
          const subData: any = stripeSub;
          const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
          const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
          const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

          const { error: subCreateError } = await supabase
            .from('subscriptions')
            .insert({
              id: nanoid(),
              memberId: member.id,
              stripeCustomerId,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: stripeSub.items.data[0]?.price.id,
              provider: 'stripe',
              status: stripeSub.status.toUpperCase(),
              tier: 'SUCCESS_PLUS',
              currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
              cancelAtPeriodEnd,
              billingCycle: stripeSub.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
              updatedAt: new Date().toISOString(),
            });

          if (subCreateError) throw subCreateError;
        }
      }
    }

    // Log activity
    await supabase
      .from('user_activities')
      .insert({
        id: nanoid(),
        userId: user.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Account Claimed',
        description: 'User claimed their SUCCESS+ account',
        metadata: JSON.stringify({
          membershipTier,
          hasStripeCustomer: !!stripeCustomerId,
        }),
      })
      .catch(() => {
        // Ignore activity logging errors
      });

    return res.status(200).json({
      success: true,
      email: user.email,
      message: 'Account claimed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to complete account claim. Please try again or contact support.',
    });
  }
}
