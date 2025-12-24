import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists in members or users table
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Create member record with trial status
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        id: nanoid(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: null,
        membershipTier: 'Free',
        membershipStatus: 'Active',
        trialEndsAt: trialEndsAt.toISOString(),
        totalSpent: 0,
        lifetimeValue: 0,
        engagementScore: 0,
        tags: ['trial'],
        priorityLevel: 'Standard',
      })
      .select()
      .single();

    if (memberError) {
      throw memberError;
    }

    // Create corresponding platform user for login
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: nanoid(),
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerified: false,
        trialEndsAt: trialEndsAt.toISOString(),
        linkedMemberId: member.id,
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Create a trial subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        id: nanoid(),
        memberId: member.id,
        status: 'TRIALING',
        tier: 'SUCCESS_PLUS_TRIAL',
        provider: 'trial',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: trialEndsAt.toISOString(),
        cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('user_activities')
      .insert({
        id: nanoid(),
        userId: user.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Started 7-Day Free Trial',
        description: `Trial account created for ${email}`,
        metadata: JSON.stringify({
          trialEndsAt: trialEndsAt.toISOString(),
          membershipTier: 'TRIALING',
        }),
      });

    if (activityError) {
      console.error('Failed to log activity:', activityError);
    }

    return res.status(201).json({
      success: true,
      message: 'Trial account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        trialEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create trial account',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
