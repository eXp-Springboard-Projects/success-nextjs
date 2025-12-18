import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { isSuccessEmail, DEFAULT_PASSWORD, AUTH_ERRORS } from '../../../lib/auth-validation';
import { validateInviteCode, markInviteCodeAsUsed } from '../../../lib/auth-utils';
import { sendStaffWelcomeEmail } from '../../../lib/resend-email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, role, inviteCode } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if email is @success.com OR valid invite code is provided
    const isSuccessStaff = isSuccessEmail(email);
    let inviteRole = role;

    if (!isSuccessStaff) {
      // Non-SUCCESS email requires valid invite code
      if (!inviteCode) {
        return res.status(403).json({
          error: 'Non-@success.com emails require an invite code'
        });
      }

      const validation = await validateInviteCode(inviteCode, email);
      if (!validation.valid) {
        return res.status(403).json({ error: validation.error });
      }

      // Use role from invite code for non-staff users
      inviteRole = validation.invite?.role || 'EDITOR';
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate role
    const validRoles = ['EDITOR', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN'];
    const userRole = inviteRole && validRoles.includes(inviteRole) ? inviteRole : 'EDITOR';

    // Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create user with default password
    const userId = uuidv4();
    const user = await prisma.users.create({
      data: {
        id: userId,
        email,
        name,
        password: hashedPassword,
        role: userRole,
        emailVerified: isSuccessStaff, // Auto-verify @success.com emails
        hasChangedDefaultPassword: false,
        inviteCode: inviteCode || null,
        membershipTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Mark invite code as used if provided
    if (inviteCode) {
      try {
        await markInviteCodeAsUsed(inviteCode, userId);
      } catch (err) {
        // Don't fail registration if this fails
      }
    }

    // Send welcome email
    try {
      const emailResult = await sendStaffWelcomeEmail(user.email, user.name, DEFAULT_PASSWORD);
      if (!emailResult.success) {
        // Don't fail registration if email fails
      }
    } catch (err) {
      // Don't fail registration if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      instructions: `Your account has been created. Login with password: ${DEFAULT_PASSWORD} and change it immediately.`
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to create account' });
  }
}
