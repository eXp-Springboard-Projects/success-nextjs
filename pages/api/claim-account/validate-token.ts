import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required', valid: false });
    }

    // Find user with this claim token
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        valid: false,
      });
    }

    // Check if account is already claimed (password set)
    if (user.password && user.password !== '') {
      return res.status(400).json({
        error: 'This account has already been claimed',
        valid: false,
      });
    }

    return res.status(200).json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to validate token',
      valid: false,
    });
  } finally {
    await prisma.$disconnect();
  }
}
