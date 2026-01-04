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

    // 🔒 SECURITY: ALL registrations now require a valid invite code
    // This prevents unauthorized users from self-registering with @success.com emails
    if (!inviteCode) {
      return res.status(403).json({
        error: 'Registration requires an invite code from a Super Admin'
      });
    }

    const validation = await validateInviteCode(inviteCode, email);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }

    // Use role from invite code
    const inviteRole = validation.invite?.role || 'EDITOR';

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

    // Create user - using camelCase to match database schema
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        role: userRole,
        primaryDepartment: null,
        emailVerified: true, // Always true for registration
        createdAt: now,
        updatedAt: now
      });

    if (createError) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Email:', email);
      console.error('Error Code:', createError.code);
      console.error('Error Message:', createError.message);
      console.error('Error Details:', createError.details);
      console.error('Error Hint:', createError.hint);
      console.error('Full Error:', JSON.stringify(createError, null, 2));
      console.error('Attempted Insert Data:', {
        id: userId,
        email: email.toLowerCase(),
        name: name,
        role: userRole,
        primaryDepartment: null,
        emailVerified: true
      });

      // Check for duplicate email constraint
      if (createError.code === '23505') {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Return detailed error in production for debugging
      return res.status(500).json({
        error: 'Database error',
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
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
    try {
      const emailResult = await sendStaffWelcomeEmail(email.toLowerCase(), name, '');
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
        id: userId,
        email: email.toLowerCase(),
        name: name,
        role: userRole
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
