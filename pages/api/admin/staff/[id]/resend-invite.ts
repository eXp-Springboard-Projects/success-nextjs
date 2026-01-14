import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const emailHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .steps {
      background: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
    }
    .features {
      margin: 20px 0;
    }
    .features ul {
      list-style: none;
      padding: 0;
    }
    .features li {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">Welcome to SUCCESS.com</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Admin Dashboard is Ready</p>
  </div>

  <div class="content">
    <p>Hello${name ? ` ${name}` : ''}!</p>

    <p>Your SUCCESS Magazine admin account has been created and is ready to use. You now have access to the new SUCCESS.com admin dashboard where you can manage content, create posts, edit pages, and more.</p>

    <div class="steps">
      <strong>To get started:</strong>
      <ol>
        <li>Visit: <a href="https://www.success.com/admin/login" style="color: #667eea;">www.success.com/admin/login</a></li>
        <li>Use your SUCCESS email address to sign in</li>
        <li>If this is your first time logging in, click "Forgot Password" to set up your password</li>
      </ol>
    </div>

    <div style="text-align: center;">
      <a href="https://www.success.com/admin/login" class="button">Access Admin Dashboard</a>
    </div>

    <div class="features">
      <strong>Your account has been set up with permissions allowing you to:</strong>
      <ul>
        <li>Create and edit blog posts</li>
        <li>Manage content with our enhanced visual editor</li>
        <li>Upload and manage media</li>
        <li>Preview content before publishing</li>
      </ul>
    </div>

    <p>If you have any questions or need assistance getting started, please reach out to the admin team.</p>

    <p><strong>Welcome to the platform!</strong></p>
  </div>

  <div class="footer">
    <p>SUCCESS Magazine Team<br>
    <a href="https://www.success.com" style="color: #667eea; text-decoration: none;">www.success.com</a></p>
  </div>
</body>
</html>
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can resend invites
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

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

    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' });
    }

    // Send welcome email via Resend
    try {
      const emailData = {
        from: process.env.RESEND_FROM_EMAIL || 'SUCCESS Magazine <hello@success.com>',
        to: staffMember.email,
        subject: 'Join the SUCCESS.com Admin Dashboard',
        html: emailHtml(staffMember.name),
        replyTo: 'noreply@success.com',
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
          action: 'STAFF_INVITE_RESENT',
          entity: 'users',
          entity_id: staffMember.id,
          details: `Resent staff invitation to ${staffMember.name} (${staffMember.email})`,
          created_at: new Date().toISOString(),
        });

      return res.status(200).json({
        message: 'Invitation email sent successfully',
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
    console.error('Resend invite API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
