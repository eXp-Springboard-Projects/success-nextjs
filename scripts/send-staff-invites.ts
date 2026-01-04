/**
 * Send welcome emails to existing staff members
 *
 * Usage:
 * npx tsx scripts/send-staff-invites.ts
 */

import { sendMail } from '../lib/resend-email';

// ============================================
// STAFF EMAILS (excluding Rachel and Tyler)
// ============================================
const STAFF_EMAILS = [
  'belle.mitchum@success.com',
  'carlos.gutierrez@success.com',
  'courtland.warren@success.com',
  'denise.long@success.com',
  'destinie.orndoff@success.com',
  'elly.kang@success.com',
  'emily.holombek@success.com',
  'emily.obrien@success.com',
  'emily.tvelia@success.com',
  'glenn.sanford@success.com',
  'harmony.heslop@success.com',
  'hugh.murphy@success.com',
  'jamie.lyons@success.com',
  'jazzlyn.torres@success.com',
  'kerrie.brown@success.com',
  'kristen.mcmahon@success.com',
  'lauren.kerrigan@success.com',
  'rena.machani@success.com',
  'sarah.kuta@success.com',
  'shawana.crayton@success.com',
  'staci.parks@success.com',
  'talitha.prospert@success.com',
  'virginia.le@success.com',
];

const emailHtml = `
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
    <p>Hello!</p>

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
      <strong>Your account has been set up with EDITOR permissions, allowing you to:</strong>
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

async function sendStaffInvites() {
  console.log('\n📧 SENDING STAFF INVITATIONS');
  console.log('==========================================\n');
  console.log(`Total recipients: ${STAFF_EMAILS.length}\n`);

  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
  };

  // Send emails one by one
  for (const email of STAFF_EMAILS) {
    try {
      console.log(`Sending to: ${email}...`);

      const result = await sendMail(
        email,
        'Join the SUCCESS.com Admin Dashboard',
        emailHtml
      );

      if (result.success) {
        console.log(`   ✓ Sent (ID: ${result.data?.id})\n`);
        results.success.push(email);
      } else {
        console.log(`   ✗ Failed: ${result.error}\n`);
        results.failed.push({ email, error: result.error || 'Unknown error' });
      }

    } catch (error: any) {
      console.log(`   ✗ Error: ${error.message}\n`);
      results.failed.push({ email, error: error.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n==========================================');
  console.log('📊 SUMMARY');
  console.log('==========================================\n');
  console.log(`✅ Successfully sent: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}\n`);

  if (results.success.length > 0) {
    console.log('✅ Successfully sent to:');
    results.success.forEach(email => {
      console.log(`   • ${email}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed to send to:');
    results.failed.forEach(({ email, error }) => {
      console.log(`   • ${email} - ${error}`);
    });
    console.log('');
  }

  console.log('📝 NEXT STEPS:');
  console.log('1. Staff members will receive welcome emails');
  console.log('2. They can access the dashboard at www.success.com/admin/login');
  console.log('3. First-time users should use "Forgot Password" to set their password\n');
}

sendStaffInvites().catch(console.error);
