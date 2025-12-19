/**
 * Test Email Service Configuration
 *
 * Tests which email providers are configured and working
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../lib/email';

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration\n');

  // Check environment variables
  console.log('📋 Email Provider Configuration:');
  console.log('--------------------------------');
  console.log('AWS SES Enabled:', process.env.AWS_SES_ENABLED === 'true');
  console.log('AWS Access Key:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set');
  console.log('AWS Secret Key:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set');
  console.log('AWS Region:', process.env.AWS_REGION || 'Not set');
  console.log('SES From Email:', process.env.SES_FROM_EMAIL || 'Not set');
  console.log('');
  console.log('Resend API Key:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('Resend From Email:', process.env.RESEND_FROM_EMAIL || 'Not set');
  console.log('');
  console.log('SendGrid API Key:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL || 'Not set');
  console.log('\n');

  // Determine which provider would be used
  const useAWSSES = process.env.AWS_SES_ENABLED === 'true' && !!process.env.AWS_ACCESS_KEY_ID;
  const useSendGrid = !!process.env.SENDGRID_API_KEY;
  const useResend = !!process.env.RESEND_API_KEY;

  console.log('🎯 Email Provider Priority:');
  console.log('--------------------------------');
  if (useAWSSES) {
    console.log('✅ AWS SES (Priority 1) - ACTIVE');
  } else {
    console.log('❌ AWS SES (Priority 1) - Not configured');
  }

  if (useSendGrid) {
    console.log('✅ SendGrid (Priority 2) - ACTIVE');
  } else {
    console.log('❌ SendGrid (Priority 2) - Not configured');
  }

  if (useResend) {
    console.log('✅ Resend (Priority 3) - ACTIVE');
  } else {
    console.log('❌ Resend (Priority 3) - Not configured');
  }

  if (!useAWSSES && !useSendGrid && !useResend) {
    console.log('\n⚠️  WARNING: No email service is configured!');
    console.log('\n📖 To configure email service:');
    console.log('   1. AWS SES (Recommended): See docs/EMAIL_QUICKSTART.md');
    console.log('   2. Resend: Add RESEND_API_KEY to .env.local');
    console.log('   3. SendGrid: Add SENDGRID_API_KEY to .env.local');
    process.exit(1);
  }

  const activeProvider = useAWSSES ? 'AWS SES' : useSendGrid ? 'SendGrid' : 'Resend';
  console.log(`\n✅ Active Provider: ${activeProvider}\n`);

  // Test email sending (only if user provides email address via command line)
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.log('💡 To test sending an actual email, run:');
    console.log('   npm run test:email your-email@example.com\n');
    process.exit(0);
  }

  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('--------------------------------\n');

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'SUCCESS Magazine - Email Service Test',
      html: `
        <h1>✅ Email Service is Working!</h1>
        <p>This is a test email from the SUCCESS Magazine CRM.</p>
        <p><strong>Provider:</strong> ${activeProvider}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated test email. If you received this, your email service is configured correctly.
        </p>
      `,
      text: `
SUCCESS Magazine - Email Service Test

✅ Email Service is Working!

This is a test email from the SUCCESS Magazine CRM.

Provider: ${activeProvider}
Sent at: ${new Date().toLocaleString()}

---
This is an automated test email. If you received this, your email service is configured correctly.
      `.trim(),
    });

    if (result) {
      console.log('✅ SUCCESS: Test email sent successfully!');
      console.log(`   Check inbox: ${testEmail}\n`);
    } else {
      console.log('❌ FAILURE: Email failed to send');
      console.log('   Check the error logs above for details\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

testEmailService().catch(console.error);
