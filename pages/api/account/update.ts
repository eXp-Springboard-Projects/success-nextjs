import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name,
        email: email.toLowerCase(),
      },
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'user',
        entityId: session.user.id,
        details: JSON.stringify({ fields: ['name', 'email'] }),
      },
    });

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update account' });
  }
}
