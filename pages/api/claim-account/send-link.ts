import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        error: 'Payment system is not configured. Please contact support.',
      });
    }

    // Check if email has active subscription in Stripe
    const stripeCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (stripeCustomers.data.length === 0) {
      return res.status(404).json({
        error: 'No active SUCCESS+ subscription found for this email address.',
      });
    }

    const stripeCustomer = stripeCustomers.data[0];

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({
        error: 'No active subscription found. Please contact support if you believe this is an error.',
      });
    }

    // Generate claim token (expires in 24 hours)
    const claimToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    // Store claim request in database
    await prisma.users.create({
      data: {
        id: nanoid(),
        email: normalizedEmail,
        name: stripeCustomer.name || normalizedEmail.split('@')[0],
        password: '', // Will be set when they claim
        role: 'EDITOR',
        emailVerified: true, // Email is verified via Stripe
        resetToken: claimToken, // Reusing reset token field for claim token
        resetTokenExpiry: tokenExpiry,
      },
    });

    // Send claim email
    const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/claim-account/verify?token=${claimToken}`;

    try {
      const emailRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: normalizedEmail,
          subject: 'Claim Your SUCCESS+ Account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #c41e3a;">Claim Your SUCCESS+ Account</h1>

              <p>Hi there!</p>

              <p>You're receiving this email because you requested to claim your SUCCESS+ online account.</p>

              <p>Click the button below to set your password and access your member dashboard:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${claimUrl}"
                   style="background-color: #c41e3a; color: white; padding: 14px 28px;
                          text-decoration: none; border-radius: 6px; display: inline-block;
                          font-weight: 600;">
                  Claim My Account
                </a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
                ${claimUrl}
              </p>

              <p style="color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

              <p style="color: #999; font-size: 12px;">
                SUCCESS Enterprises, LLC<br>
                © ${new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        console.error('Failed to send claim email');
      }
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue even if email fails - they can contact support
    }

    return res.status(200).json({
      success: true,
      message: 'Claim link sent to your email',
    });
  } catch (error) {
    console.error('Claim account error:', error);
    return res.status(500).json({
      error: 'Failed to process claim request. Please try again or contact support.',
    });
  } finally {
    await prisma.$disconnect();
  }
}
