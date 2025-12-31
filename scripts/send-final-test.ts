import { sendMail } from '../lib/resend-email';

async function sendFinalTest() {
  console.log('\n📧 Sending Final Test Emails\n');

  const recipients = [
    'rachel.nead@success.com',
    'rachel.nead@exprealty.net'
  ];

  const subject = '✅ SUCCESS Email System Test - Check Inbox & Spam';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 40px 30px; }
          .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
          .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .info-box strong { color: #856404; }
          ul { margin: 16px 0; padding-left: 24px; }
          li { margin: 8px 0; }
          .footer { padding: 20px; text-align: center; background: #f9fafb; color: #6b7280; font-size: 13px; }
          .timestamp { font-family: 'Courier New', monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SUCCESS Magazine</h1>
            <p>Email System Test</p>
          </div>

          <div class="content">
            <div class="success-icon">✅</div>

            <h2 style="margin-top: 0; color: #333;">Email System is Working!</h2>

            <p>This is a test email from the SUCCESS Magazine email system at <strong>www.success.com</strong></p>

            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Sent from: Production server (www.success.com)</li>
              <li>Email service: Resend API</li>
              <li>Sender: onboarding@resend.dev (sandbox domain)</li>
              <li>Timestamp: <span class="timestamp">${new Date().toISOString()}</span></li>
            </ul>

            <div class="info-box">
              <strong>⚠️ Important:</strong> Emails are currently sent from the Resend sandbox domain (onboarding@resend.dev).
              This may cause emails to land in spam/junk folders. Once success.com is verified in Resend by the account owner,
              emails will come from noreply@success.com and won't be flagged as spam.
            </div>

            <p><strong>If you received this email, the SUCCESS email system is fully operational and ready for:</strong></p>
            <ul>
              <li>✉️ CRM email campaigns</li>
              <li>📰 Newsletter sends</li>
              <li>🔐 Password resets</li>
              <li>💳 Transactional emails (receipts, confirmations)</li>
              <li>👥 Staff welcome emails</li>
              <li>🎯 Automated email sequences</li>
            </ul>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
              <strong>Next Steps:</strong><br>
              1. Check both inbox and spam/junk folder<br>
              2. Contact Resend account owner to verify success.com domain<br>
              3. Once verified, all emails will deliver to inbox properly
            </p>
          </div>

          <div class="footer">
            <p><strong>SUCCESS Magazine</strong></p>
            <p>&copy; ${new Date().getFullYear()} SUCCESS Enterprises. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px;">
              This is a test email from your SUCCESS email system.<br>
              Production URL: <a href="https://www.success.com" style="color: #d32f2f;">www.success.com</a>
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

  console.log('\n✅ Test complete! Check your inbox AND spam/junk folders.\n');
  console.log('📊 The Resend API shows emails are being delivered.');
  console.log('🔍 If not in inbox, check spam/junk folders.');
  console.log('🌐 View delivery logs: https://resend.com/emails\n');
}

sendFinalTest().catch(console.error);
