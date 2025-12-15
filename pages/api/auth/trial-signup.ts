import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const existingMember = await prisma.members.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Create member record with trial status
    const member = await prisma.members.create({
      data: {
        id: nanoid(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: null,
        membershipTier: 'Free',
        membershipStatus: 'Active',
        trialEndsAt,
        totalSpent: 0,
        lifetimeValue: 0,
        engagementScore: 0,
        tags: ['trial'],
        priorityLevel: 'Standard',
      },
    });

    // Create corresponding platform user for login
    const user = await prisma.users.create({
      data: {
        id: nanoid(),
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'MEMBER', // Basic role for trial users
        emailVerified: false,
        trialEndsAt,
        linkedMemberId: member.id,
      },
    });

    // Create a trial subscription record
    await prisma.subscriptions.create({
      data: {
        id: nanoid(),
        memberId: member.id,
        status: 'TRIALING',
        tier: 'SUCCESS_PLUS_TRIAL',
        provider: 'trial',
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.user_activities.create({
      data: {
        id: nanoid(),
        userId: user.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Started 7-Day Free Trial',
        description: `Trial account created for ${email}`,
        metadata: JSON.stringify({
          trialEndsAt: trialEndsAt.toISOString(),
          membershipTier: 'TRIALING',
        }),
      },
    });

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
    console.error('Trial signup error:', error);
    return res.status(500).json({
      error: 'Failed to create trial account',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
