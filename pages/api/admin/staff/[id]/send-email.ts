import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can send emails to staff
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { subject, message, template } = req.body;

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

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' });
    }

    // Send email via Resend
    try {
      const emailData = {
        from: process.env.EMAIL_FROM || 'SUCCESS Magazine <noreply@success.com>',
        to: staffMember.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">SUCCESS Magazine</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <p style="font-size: 16px; color: #333;">Hi ${staffMember.name},</p>
              <div style="margin: 20px 0; line-height: 1.6; color: #555;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              ${template ? `
                <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-left: 4px solid #000;">
                  ${template}
                </div>
              ` : ''}
            </div>
            <div style="padding: 20px; background: #f9f9f9; text-align: center; color: #888; font-size: 14px;">
              <p>This email was sent from the SUCCESS Magazine admin panel by ${session.user.name}</p>
              <p>© ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      const result = await resend.emails.send(emailData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          action: 'STAFF_EMAIL_SENT',
          entity: 'users',
          entity_id: staffMember.id,
          details: `Sent email to ${staffMember.name} (${staffMember.email}): "${subject}"`,
          created_at: new Date().toISOString(),
        });

      return res.status(200).json({
        message: 'Email sent successfully',
        emailId: result.data?.id,
        recipient: {
          name: staffMember.name,
          email: staffMember.email,
        },
      });
    } catch (emailError: any) {
      console.error('Resend error:', emailError);
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailError.message,
      });
    }
  } catch (error) {
    console.error('Send email API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
