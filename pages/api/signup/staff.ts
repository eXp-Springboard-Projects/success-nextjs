import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '@/lib/supabase';

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

    const supabase = supabaseAdmin();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create pending staff account (PENDING status - requires admin approval)
    const userId = nanoid();
    const fullName = `${firstName} ${lastName}`;

    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        name: fullName,
        role: 'PENDING',
      });

    if (error) {
      throw error;
    }

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
