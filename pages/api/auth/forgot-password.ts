import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { sendPasswordResetEmail } from '../../../lib/resend-email';
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

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;

    const emailResult = await sendPasswordResetEmail(user.email, user.name || 'User', resetUrl);

    if (!emailResult.success) {
      // Don't fail the request - user doesn't know if email exists anyway
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
