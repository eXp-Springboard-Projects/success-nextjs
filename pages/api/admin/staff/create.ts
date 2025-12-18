import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can directly create staff accounts
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName, role, primaryDepartment } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !primaryDepartment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email is @success.com
    if (!email.toLowerCase().endsWith('@success.com')) {
      return res.status(400).json({ error: 'Email must be a @success.com address' });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate department
    const validDepartments = [
      'SUPER_ADMIN',
      'CUSTOMER_SERVICE',
      'EDITORIAL',
      'SUCCESS_PLUS',
      'DEV',
      'MARKETING',
      'COACHING',
    ];
    if (!validDepartments.includes(primaryDepartment)) {
      return res.status(400).json({ error: 'Invalid department' });
    }

    // Check if user already exists
    const existingUser = await prisma.$queryRaw<Array<{ email: string }>>`
      SELECT email FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = nanoid();
    await prisma.$executeRaw`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        role,
        primary_department,
        email_verified,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${email.toLowerCase()},
        ${hashedPassword},
        ${firstName},
        ${lastName},
        ${role}::"UserRole",
        ${primaryDepartment}::"Department",
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;

    // Log the activity
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
      ) VALUES (
        gen_random_uuid(),
        ${session.user.id},
        'CREATE',
        'USER',
        ${userId},
        jsonb_build_object(
          'created_email', ${email.toLowerCase()},
          'role', ${role},
          'department', ${primaryDepartment},
          'created_by', ${session.user.email}
        ),
        CURRENT_TIMESTAMP
      )
    `;

    return res.status(200).json({
      message: 'Staff member created successfully',
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        primaryDepartment,
      },
    });
  } catch (error: any) {

    // Check for duplicate email error
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    return res.status(500).json({ error: 'Failed to create staff member' });
  }
}
