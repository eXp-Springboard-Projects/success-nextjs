import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate @success.com email
    if (!email.toLowerCase().endsWith('@success.com')) {
      return res.status(400).json({ error: 'Only @success.com email addresses are allowed' });
    }

    // Check if user already exists
    const existingUser = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create pending staff account (PENDING status - requires admin approval)
    const userId = nanoid();
    const fullName = `${firstName} ${lastName}`;
    await prisma.$executeRaw`
      INSERT INTO users (
        id, email, password, name, role, "createdAt", "updatedAt"
      ) VALUES (
        ${userId},
        ${email.toLowerCase()},
        ${hashedPassword},
        ${fullName},
        'PENDING',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    return res.status(201).json({
      message: 'Account created successfully. Pending admin approval.',
      userId,
    });
  } catch (error: any) {
    console.error('Staff signup error:', error);

    // Check for specific database errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (error.message?.includes('column') || error.message?.includes('does not exist')) {
      return res.status(500).json({ error: 'Database schema error. Please contact support.' });
    }

    return res.status(500).json({
      error: 'Failed to create account. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
