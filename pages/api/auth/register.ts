import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
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

  const supabase = supabaseAdmin();

  try {
    const { email, name, password, role, inviteCode } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email is @success.com OR rachel.nead@exprealty.net OR valid invite code is provided
    const isSuccessStaff = isSuccessEmail(email) || email.toLowerCase() === 'rachel.nead@exprealty.net';
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
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate role
    const validRoles = ['EDITOR', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN'];
    const userRole = inviteRole && validRoles.includes(inviteRole) ? inviteRole : 'EDITOR';

    // Hash user's chosen password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with their chosen password
    // Use snake_case column names (production Supabase uses snake_case)
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || '';

    // Use minimal fields only - exactly like staff/create.ts which works
    const { data: user, error: createError} = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: userRole,
        primary_department: null,
        email_verified: true, // Always true for registration
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      // Check for duplicate email constraint
      if (createError.code === '23505') {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      return res.status(500).json({
        error: 'Database schema error. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? createError.message : undefined
      });
    }

    // Mark invite code as used if provided
    if (inviteCode) {
      try {
        await markInviteCodeAsUsed(inviteCode, userId);
      } catch (err) {
        // Don't fail registration if this fails
      }
    }

    // Send welcome email (without password since they created their own)
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    try {
      const emailResult = await sendStaffWelcomeEmail(user.email, fullName, '');
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
        name: fullName,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Check for specific database errors
    if (error.code === '23505') {
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
