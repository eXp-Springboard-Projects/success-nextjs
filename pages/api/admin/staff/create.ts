import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

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

    const supabase = supabaseAdmin();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = nanoid();
    const now = new Date().toISOString();

    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        primary_department: primaryDepartment,
        email_verified: true,
        created_at: now,
        updated_at: now
      });

    if (createError) {
      throw createError;
    }

    // Log the activity
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'CREATE',
        resource_type: 'USER',
        resource_id: userId,
        details: {
          created_email: email.toLowerCase(),
          role: role,
          department: primaryDepartment,
          created_by: session.user.email
        },
        created_at: now
      });

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
