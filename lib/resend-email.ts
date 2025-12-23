import { Resend } from 'resend';

// Lazy initialization to avoid errors when API key is missing
let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Resend
 */
export async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return { success: false, error: 'Sender email not configured' };
  }

  try {
    const client = getResendClient();
    if (!client) {
      return { success: false, error: 'Email client not initialized' };
    }

    const result = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });

    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 14px 32px; background: #d32f2f; color: white !important; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: 600; }
          .button:hover { background: #b71c1c; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 13px; color: #6b7280; background: #f9fafb; border-radius: 0 0 8px 8px; }
          .footer a { color: #d32f2f; text-decoration: none; }
          .url-backup { word-break: break-all; color: #6b7280; font-size: 12px; background: #f3f4f6; padding: 12px; border-radius: 4px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Hi ${name},</h2>
            <p>You requested to reset your password for your SUCCESS Magazine account.</p>
            <p>Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>⚠️ Security Note:</strong>
              <p style="margin: 8px 0 0 0;">This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="url-backup">${resetUrl}</div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
            <p><a href="https://www.success.com">Visit SUCCESS.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail(email, 'Reset Your Password - SUCCESS Magazine', html);
}

/**
 * Send staff welcome email
 */
export async function sendStaffWelcomeEmail(email: string, name: string, tempPassword: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/admin/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .credentials { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0; }
          .credentials p { margin: 8px 0; }
          .credentials code { background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; }
          .button { display: inline-block; padding: 14px 32px; background: #d32f2f; color: white !important; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: 600; }
          .button:hover { background: #b71c1c; }
          .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 13px; color: #6b7280; background: #f9fafb; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to SUCCESS!</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Hi ${name},</h2>
            <p>Your SUCCESS Magazine staff account has been created! You now have access to the admin dashboard.</p>

            <div class="credentials">
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: <code>${email}</code></p>
              <p>Temporary Password: <code>${tempPassword}</code></p>
            </div>

            <a href="${loginUrl}" class="button">Login to Admin Dashboard</a>

            <div class="info">
              <strong>ℹ️ Important:</strong>
              <p style="margin: 8px 0 0 0;">You'll be required to change your password on first login for security. Please choose a strong password that you don't use elsewhere.</p>
            </div>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>View and manage content</li>
              <li>Access analytics and reports</li>
              <li>Manage users and permissions</li>
              <li>Configure site settings</li>
            </ul>

            <p>If you have any questions, please reach out to your team administrator.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail(email, 'Welcome to SUCCESS Magazine - Admin Access', html);
}

/**
 * Send invite code email
 */
export async function sendInviteCodeEmail(email: string, inviteCode: string, invitedByName: string) {
  const registerUrl = `${process.env.NEXTAUTH_URL}/register?code=${inviteCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .invite-code { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0; text-align: center; }
          .invite-code code { font-size: 24px; font-weight: 700; color: #d32f2f; letter-spacing: 2px; }
          .button { display: inline-block; padding: 14px 32px; background: #d32f2f; color: white !important; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: 600; }
          .button:hover { background: #b71c1c; }
          .footer { padding: 20px; text-align: center; font-size: 13px; color: #6b7280; background: #f9fafb; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ You're Invited to SUCCESS!</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Hello!</h2>
            <p>${invitedByName} has invited you to join SUCCESS Magazine as a contributor.</p>

            <div class="invite-code">
              <p style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Your Invite Code</p>
              <code>${inviteCode}</code>
            </div>

            <p>Use this code to create your account and start contributing to SUCCESS Magazine.</p>

            <a href="${registerUrl}" class="button">Create Your Account</a>

            <p style="font-size: 14px; color: #6b7280;">This invite code will expire in 7 days and can be used once.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail(email, "You're Invited to Join SUCCESS Magazine", html);
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(email: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .footer { padding: 20px; text-align: center; font-size: 13px; color: #6b7280; background: #f9fafb; border-radius: 0 0 8px 8px; }
          .footer a { color: #d32f2f; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Welcome to SUCCESS!</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Thank you for subscribing!</h2>
            <p>You're now part of the SUCCESS Magazine community. Get ready to receive:</p>
            <ul>
              <li><strong>Weekly insights</strong> from industry leaders</li>
              <li><strong>Exclusive content</strong> and interviews</li>
              <li><strong>Tips and strategies</strong> for personal and professional growth</li>
              <li><strong>Updates</strong> on events and special offers</li>
            </ul>
            <p>Stay inspired and keep achieving your goals!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/newsletter/unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail(email, 'Welcome to SUCCESS Magazine Newsletter!', html);
}

/**
 * Send subscription receipt email
 */
export async function sendSubscriptionReceiptEmail(
  email: string,
  name: string,
  plan: string,
  amount: number,
  receiptUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .receipt { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 24px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-row:last-child { border-bottom: none; font-weight: 600; font-size: 18px; }
          .button { display: inline-block; padding: 14px 32px; background: #16a34a; color: white !important; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: 600; }
          .footer { padding: 20px; text-align: center; font-size: 13px; color: #6b7280; background: #f9fafb; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful!</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Thank you, ${name}!</h2>
            <p>Your subscription to SUCCESS Magazine has been confirmed. Welcome to the SUCCESS+ community!</p>

            <div class="receipt">
              <div class="receipt-row">
                <span>Subscription Plan:</span>
                <span><strong>${plan}</strong></span>
              </div>
              <div class="receipt-row">
                <span>Amount Paid:</span>
                <span><strong>$${(amount / 100).toFixed(2)}</strong></span>
              </div>
            </div>

            <p><strong>What's included:</strong></p>
            <ul>
              <li>Unlimited access to premium articles</li>
              <li>Exclusive videos and podcasts</li>
              <li>Digital magazine issues</li>
              <li>Member-only events</li>
            </ul>

            <a href="${receiptUrl}" class="button">View Receipt</a>

            <p style="font-size: 14px; color: #6b7280;">You can manage your subscription anytime from your account dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SUCCESS Magazine. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail(email, 'Payment Confirmed - SUCCESS Magazine', html);
}
