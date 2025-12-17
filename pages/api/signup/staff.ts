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

    // Create pending staff account
    const userId = nanoid();
    await prisma.$executeRaw`
      INSERT INTO users (
        id, email, password, first_name, last_name, role, created_at, updated_at
      ) VALUES (
        ${userId},
        ${email.toLowerCase()},
        ${hashedPassword},
        ${firstName},
        ${lastName},
        'PENDING',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    return res.status(201).json({
      message: 'Account created successfully. Pending admin approval.',
      userId,
    });
  } catch (error) {
    console.error('Error creating staff account:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}
