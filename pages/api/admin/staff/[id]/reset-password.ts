import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can reset staff passwords
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { forceChangeOnLogin = true } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const supabase = supabaseAdmin();

    // Get staff member
    const { data: staffMember, error: staffError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', id)
      .single();

    if (staffError || !staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user with reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
        has_changed_default_password: !forceChangeOnLogin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

    // Send reset email
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'SUCCESS Magazine <noreply@success.com>',
          to: staffMember.email,
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">SUCCESS Magazine</h1>
              </div>
              <div style="padding: 30px; background: #ffffff;">
                <p style="font-size: 16px; color: #333;">Hi ${staffMember.name},</p>
                <p style="line-height: 1.6; color: #555;">
                  A password reset has been requested for your account by ${session.user.name}.
                </p>
                <p style="line-height: 1.6; color: #555;">
                  Click the button below to reset your password. This link will expire in 24 hours.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                <p style="line-height: 1.6; color: #555; font-size: 14px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
                </p>
                ${forceChangeOnLogin ? `
                  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
                    <strong>Note:</strong> You will be required to change your password upon first login.
                  </div>
                ` : ''}
                <p style="line-height: 1.6; color: #888; font-size: 13px; margin-top: 30px;">
                  If you did not request this password reset, please contact your administrator immediately.
                </p>
              </div>
              <div style="padding: 20px; background: #f9f9f9; text-align: center; color: #888; font-size: 14px;">
                <p>© ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Continue anyway - token is saved in database
      }
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: session.user.id,
        action: 'PASSWORD_RESET_INITIATED',
        entity: 'users',
        entity_id: staffMember.id,
        details: `Password reset initiated for ${staffMember.name} (${staffMember.email})${forceChangeOnLogin ? ' - Force change on login enabled' : ''}`,
        created_at: new Date().toISOString(),
      });

    return res.status(200).json({
      message: 'Password reset email sent successfully',
      resetToken, // Include token in response for admin reference (not sent to user)
      expiresAt: resetTokenExpiry,
      recipient: {
        name: staffMember.name,
        email: staffMember.email,
      },
    });
  } catch (error) {
    console.error('Reset password API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
