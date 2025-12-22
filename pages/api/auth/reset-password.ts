import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with valid token
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        action: 'PASSWORD_RESET',
        entity: 'user',
        entityId: user.id,
        details: JSON.stringify({ method: 'reset_token' }),
      },
    });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}
