import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import { sendPasswordResetEmail } from '../../../lib/resend-email';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (userError || !user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Forgot Password] Failed to update user:', updateError);
    }

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;

    const emailResult = await sendPasswordResetEmail(user.email, user.name || 'User', resetUrl);

    if (!emailResult.success) {
      console.error('[Forgot Password] Failed to send email:', emailResult.error);
      // Don't fail the request - user doesn't know if email exists anyway
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('[Forgot Password] Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
