import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required', valid: false });
    }

    // Find user with this claim token
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('resetToken', token)
      .gte('resetTokenExpiry', new Date().toISOString())
      .limit(1);

    if (userError) throw userError;

    const user = users?.[0];

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
  }
}
