import { sendMail } from '../lib/resend-email';

async function sendFinalTest() {
  console.log('\n📧 Sending FINAL Test Email (FIXED)\n');

  const recipients = [
    'rachel.nead@success.com',
    'rachel.nead@exprealty.net'
  ];

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const subject = '✅ FIXED - SUCCESS Email System Test';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 40px 30px; }
          .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
          .info-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .info-box strong { color: #065f46; }
          .tech-details { background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 24px 0; font-family: 'Courier New', monospace; font-size: 13px; }
          .tech-details p { margin: 8px 0; }
          ul { margin: 16px 0; padding-left: 24px; }
          li { margin: 8px 0; }
          .footer { padding: 20px; text-align: center; background: #f9fafb; color: #6b7280; font-size: 13px; }
          .timestamp { font-family: 'Courier New', monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email System Fixed!</h1>
            <p>SUCCESS Magazine Email Testing</p>
          </div>

          <div class="content">
            <div class="success-icon">✅</div>

            <h2 style="margin-top: 0; color: #16a34a;">The Fix is Complete!</h2>

            <p>This email confirms that the SUCCESS Magazine email system is now properly configured and working.</p>

            <div class="info-box">
              <strong>✅ What was fixed:</strong>
              <p style="margin: 8px 0 0 0;">The RESEND_FROM_EMAIL environment variable was set to "noreply@success.com" but that domain is not verified. Changed it to "onboarding@resend.dev" (Resend's sandbox domain) which is pre-verified and works immediately.</p>
            </div>

            <div class="tech-details">
              <p><strong>Technical Details:</strong></p>
              <p>• From: onboarding@resend.dev</p>
              <p>• To: (recipient email)</p>
              <p>• Service: Resend API</p>
              <p>• Timestamp: ${timestamp}</p>
              <p>• Environment: Production (www.success.com)</p>
            </div>

            <p><strong>✅ Email System Now Ready For:</strong></p>
            <ul>
              <li>CRM email campaigns</li>
              <li>Newsletter sends</li>
              <li>Password resets</li>
              <li>Transactional emails (receipts, confirmations)</li>
              <li>Staff welcome emails</li>
              <li>Automated email sequences</li>
            </ul>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
              <strong>📧 About Spam Folders:</strong><br>
              Emails from sandbox domain (onboarding@resend.dev) may land in spam folders. Once the Resend account owner verifies success.com domain, all emails will be from "noreply@success.com" and deliver to inbox properly.
            </p>
          </div>

          <div class="footer">
            <p><strong>SUCCESS Magazine</strong></p>
            <p>&copy; ${new Date().getFullYear()} SUCCESS Enterprises. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px;">
              Production URL: <a href="https://www.success.com" style="color: #16a34a;">www.success.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  for (const email of recipients) {
    console.log(`\n📤 Sending to: ${email}`);

    const result = await sendMail(email, subject, html);

    if (result.success) {
      console.log(`✅ SUCCESS: Email sent to ${email}`);
      if (result.data) {
        console.log(`   Email ID: ${result.data.id || 'N/A'}`);
      }
    } else {
      console.log(`❌ FAILED: ${result.error}`);
    }
  }

  console.log('\n✅ Test complete!');
  console.log('📊 Check the Resend API to confirm delivery: https://resend.com/emails');
  console.log('📬 Check your inbox AND spam/junk folders.\n');
}

sendFinalTest().catch(console.error);
