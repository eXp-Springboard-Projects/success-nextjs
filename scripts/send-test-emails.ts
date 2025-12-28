/**
 * Script to send test emails to Rachel Nead
 * Tests the email functionality with SUCCESS branding
 */

const testEmails = async () => {
  console.log('\n📧 Sending Test Emails to Rachel Nead\n');
  console.log('═'.repeat(80));

  const recipients = [
    'rachel.nead@success.com',
    'rachel.nead@exprealty.net'
  ];

  const subject = 'Test Email from SUCCESS - Email System Working! ✅';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .badge {
            display: inline-block;
            background: #d1fae5;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .info-box {
            background: #f3f4f6;
            border-left: 4px solid #d32f2f;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .info-box h3 {
            margin: 0 0 10px 0;
            color: #d32f2f;
            font-size: 18px;
          }
          .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .info-box li {
            margin: 8px 0;
          }
          .success-icon {
            font-size: 64px;
            text-align: center;
            margin: 20px 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 24px 0;
          }
          .stat-card {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #d97706;
          }
          .stat-label {
            font-size: 13px;
            color: #92400e;
            margin-top: 5px;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
            font-size: 13px;
            color: #6b7280;
          }
          .footer a {
            color: #d32f2f;
            text-decoration: none;
          }
          .timestamp {
            font-family: 'Courier New', monospace;
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email System Test</h1>
            <p>SUCCESS Magazine CRM & Marketing Platform</p>
          </div>

          <div class="content">
            <div class="success-icon">✅</div>

            <div class="badge">Test Email</div>

            <h2 style="margin-top: 0; color: #111;">Email Delivery Confirmed!</h2>

            <p>Hi Rachel,</p>

            <p>This is a test email to confirm that the SUCCESS email system is working correctly.
            If you're reading this, it means:</p>

            <div class="info-box">
              <h3>✓ System Status: Operational</h3>
              <ul>
                <li><strong>Resend API:</strong> Connected and functioning</li>
                <li><strong>Email Templates:</strong> Rendering properly</li>
                <li><strong>Delivery Service:</strong> Successfully sending</li>
                <li><strong>Recipient Processing:</strong> Working as expected</li>
              </ul>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">2</div>
                <div class="stat-label">Recipients</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">100%</div>
                <div class="stat-label">Success Rate</div>
              </div>
            </div>

            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Sent to: rachel.nead@success.com & rachel.nead@exprealty.net</li>
              <li>Email Provider: Resend</li>
              <li>Template: HTML with inline CSS</li>
              <li>Timestamp: <span class="timestamp">${new Date().toISOString()}</span></li>
            </ul>

            <div class="info-box">
              <h3>📋 Next Steps</h3>
              <ul>
                <li>Verify both email addresses received this message</li>
                <li>Check spam/junk folders if not in inbox</li>
                <li>Test CRM email campaigns when ready</li>
                <li>Configure email templates for marketing</li>
              </ul>
            </div>

            <p>The SUCCESS email system is ready for:</p>
            <ul>
              <li>Newsletter campaigns</li>
              <li>CRM automated sequences</li>
              <li>Transactional emails (receipts, confirmations)</li>
              <li>Staff notifications</li>
              <li>Customer support communications</li>
            </ul>

            <p style="margin-top: 30px;">
              <strong>Questions or issues?</strong> Check the email configuration in
              <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">.env.local</code>
            </p>
          </div>

          <div class="footer">
            <p><strong>SUCCESS Magazine</strong></p>
            <p>&copy; ${new Date().getFullYear()} SUCCESS Enterprises. All rights reserved.</p>
            <p>
              <a href="https://www.success.com">Visit SUCCESS.com</a> |
              <a href="https://www.success.com/admin">Admin Dashboard</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">
              This is an automated test email from your SUCCESS email system.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  let successCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    console.log(`\n📤 Sending to: ${recipient}`);
    console.log('─'.repeat(80));

    try {
      const response = await fetch('http://localhost:3000/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          subject,
          html,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ SUCCESS: Email sent to ${recipient}`);
        if (result.data) {
          console.log(`   Message ID: ${result.data.id || 'N/A'}`);
        }
        successCount++;
      } else {
        console.log(`❌ FAILED: ${result.error || 'Unknown error'}`);
        failCount++;
      }
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   ✅ Sent: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 Total: ${recipients.length}`);

  if (successCount === recipients.length) {
    console.log('\n🎉 All test emails sent successfully!\n');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some emails failed to send.\n');
  } else {
    console.log('\n❌ All emails failed. Check your email configuration.\n');
    console.log('   Required environment variables:');
    console.log('   - RESEND_API_KEY');
    console.log('   - RESEND_FROM_EMAIL\n');
  }

  console.log('═'.repeat(80) + '\n');
};

// Run the test
testEmails().catch(console.error);
