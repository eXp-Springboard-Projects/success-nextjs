import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { validateNewPassword, isDefaultPassword, AUTH_ERRORS } from '../../../lib/auth-validation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: AUTH_ERRORS.CURRENT_PASSWORD_INCORRECT });
    }

    // Validate new password
    const validation = validateNewPassword(newPassword);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        hasChangedDefaultPassword: true,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}
