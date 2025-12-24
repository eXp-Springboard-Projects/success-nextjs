import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { sendEmail } from '../../../../../lib/email';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
      const adminEmail = session.user.email;
      if (!adminEmail) {
        return res.status(400).json({ error: 'User email not found' });
      }
      const adminName = session.user.name || 'Admin';

      // Send test email
      const emailHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1>Email System Test Successful</h1>
              </div>
              <div class="content">
                <h2>Hi ${adminName},</h2>
                <p>This is a test email from your SUCCESS Magazine DevOps system.</p>

                <div class="info-box">
                  <strong>Test Details:</strong>
                  <p><strong>Sent by:</strong> ${adminName} (${adminEmail})</p>
                  <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                  <p><strong>System:</strong> SUCCESS Magazine Admin DevOps</p>
                </div>

                <p>If you received this email, your email service is configured correctly and working properly.</p>

                <p><strong>Email Service Status:</strong></p>
                <ul>
                  <li>✅ SMTP connection successful</li>
                  <li>✅ Email delivery confirmed</li>
                  <li>✅ HTML rendering working</li>
                </ul>

                <p>You can safely close this email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
                <p>This is an automated test email from the DevOps system.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const emailText = `
Email System Test Successful

Hi ${adminName},

This is a test email from your SUCCESS Magazine DevOps system.

Test Details:
- Sent by: ${adminName} (${adminEmail})
- Timestamp: ${new Date().toLocaleString()}
- System: SUCCESS Magazine Admin DevOps

If you received this email, your email service is configured correctly and working properly.

Email Service Status:
✅ SMTP connection successful
✅ Email delivery confirmed
✅ Text rendering working

You can safely close this email.

---
© ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.
This is an automated test email from the DevOps system.
      `;

      const emailSent = await sendEmail({
        to: adminEmail,
        subject: `✅ Email System Test - ${new Date().toLocaleDateString()}`,
        html: emailHTML,
        text: emailText
      });

      // Log this action in audit logs
      await supabase
        .from('audit_logs')
        .insert({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userEmail: session.user.email,
          userName: session.user.name,
          action: 'devops.test_email_sent',
          entityType: 'System',
          changes: { recipient: adminEmail, success: emailSent },
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
          createdAt: new Date().toISOString()
        });

      if (!emailSent) {
        // Email service not configured
        return res.status(200).json({
          message: 'Email service not configured. Check SENDGRID_API_KEY or RESEND_API_KEY in environment variables.',
          sent: false,
          notice: 'Email was logged to console instead. Configure an email service to enable sending.'
        });
      }

      return res.status(200).json({
        message: `Test email sent successfully to ${adminEmail}`,
        sent: true,
        recipient: adminEmail,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
