import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
          memberId: true,
          member: {
            select: {
              membershipTier: true,
              membershipStatus: true,
              totalSpent: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform member data to include membership tier
      const transformedUsers = users.map((user) => ({
        ...user,
        membershipTier: user.member?.membershipTier || null,
        membershipStatus: user.member?.membershipStatus || null,
        totalSpent: user.member?.totalSpent ? user.member.totalSpent.toNumber() : 0,
        member: undefined, // Remove the nested member object
      }));

      return res.status(200).json(transformedUsers);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch users', message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, password, role, bio, avatar } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique ID
      const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user
      const newUser = await prisma.users.create({
        data: {
          id,
          name,
          email,
          password: hashedPassword,
          role: role || 'EDITOR',
          bio: bio || null,
          avatar: avatar || null,
          emailVerified: false,
          hasChangedDefaultPassword: false,
          updatedAt: new Date(),
        },
      });

      // Don't return password
      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
