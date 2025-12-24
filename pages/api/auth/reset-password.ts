import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with valid token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('resetToken', token)
      .gt('resetTokenExpiry', new Date().toISOString())
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Log activity
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        userId: user.id,
        action: 'PASSWORD_RESET',
        entity: 'user',
        entityId: user.id,
        details: JSON.stringify({ method: 'reset_token' }),
      });

    if (logError) {
      console.error('[Reset Password] Failed to log activity:', logError);
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}
