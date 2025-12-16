import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const defaultTemplates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to SUCCESS+',
    previewText: 'Get started with your SUCCESS+ membership',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Welcome, {{firstName}}!</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Thank you for joining SUCCESS+. We're excited to have you in our community.</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Your account is now active and you have access to all premium content and features.</p><a href="https://www.success.com/success-plus" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Get Started</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;"><a href="{{unsubscribeUrl}}" style="color: #3b82f6;">Unsubscribe</a></p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'unsubscribeUrl'],
  },
  {
    name: 'Password Reset',
    subject: 'Reset Your Password',
    previewText: 'Click here to reset your password',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Reset Your Password</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">We received a request to reset your password. Click the button below to set a new password.</p><a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a><p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">If you didn't request this, you can safely ignore this email.</p></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;">SUCCESS Magazine</p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'resetUrl'],
  },
  {
    name: 'Purchase Confirmation',
    subject: 'Your Purchase Confirmation',
    previewText: 'Thank you for your purchase',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Thank You for Your Purchase!</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Your order has been confirmed. Here are the details:</p><div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0 0 10px 0; color: #111827;"><strong>Order:</strong> {{orderNumber}}</p><p style="margin: 0 0 10px 0; color: #111827;"><strong>Total:</strong> ${{orderTotal}}</p><p style="margin: 0; color: #111827;"><strong>Date:</strong> {{orderDate}}</p></div><a href="{{receiptUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Receipt</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;"><a href="{{unsubscribeUrl}}" style="color: #3b82f6;">Unsubscribe</a></p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'orderNumber', 'orderTotal', 'orderDate', 'receiptUrl', 'unsubscribeUrl'],
  },
  {
    name: 'Subscription Active',
    subject: 'Your Subscription is Active',
    previewText: 'Welcome to SUCCESS+',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Your Subscription is Active</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your SUCCESS+ subscription is now active.</p><div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0 0 10px 0; color: #111827;"><strong>Plan:</strong> {{planName}}</p><p style="margin: 0; color: #111827;"><strong>Next Billing Date:</strong> {{nextBillingDate}}</p></div><a href="https://www.success.com/success-plus" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Access Premium Content</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;"><a href="{{unsubscribeUrl}}" style="color: #3b82f6;">Unsubscribe</a></p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'planName', 'nextBillingDate', 'unsubscribeUrl'],
  },
  {
    name: 'Subscription Cancelled',
    subject: 'Subscription Cancelled',
    previewText: 'Your subscription has been cancelled',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Subscription Cancelled</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Your subscription has been cancelled as requested.</p><div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; color: #111827;">You'll continue to have access until: <strong>{{accessUntil}}</strong></p></div><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">We're sorry to see you go. If you change your mind, you can resubscribe anytime.</p><a href="https://www.success.com/success-plus/upgrade" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Resubscribe</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;">SUCCESS Magazine</p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'accessUntil'],
  },
  {
    name: 'Trial Expiring',
    subject: 'Your Trial Expires Soon',
    previewText: 'Subscribe to keep your access',
    category: 'marketing',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">Your Trial Expires Soon</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Your free trial expires in {{daysRemaining}} days. Subscribe now to keep access to all premium content.</p><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;"><p style="margin: 0; color: #92400e;">⏰ Trial ends: {{trialEndDate}}</p></div><a href="{{upgradeUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Subscribe Now</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;"><a href="{{unsubscribeUrl}}" style="color: #3b82f6;">Unsubscribe</a></p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'daysRemaining', 'trialEndDate', 'upgradeUrl', 'unsubscribeUrl'],
  },
  {
    name: 'Ticket Created',
    subject: 'We Received Your Request',
    previewText: 'Your support ticket has been created',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">We Received Your Request</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Thanks for contacting us. We've created a support ticket for your request.</p><div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0 0 10px 0; color: #111827;"><strong>Ticket #:</strong> {{ticketNumber}}</p><p style="margin: 0; color: #111827;"><strong>Subject:</strong> {{ticketSubject}}</p></div><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">We'll respond as soon as possible, typically within 24 hours.</p><a href="{{ticketUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Ticket</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;">SUCCESS Magazine</p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'ticketNumber', 'ticketSubject', 'ticketUrl'],
  },
  {
    name: 'Ticket Reply',
    subject: 'New Reply on Your Support Ticket',
    previewText: 'We've responded to your ticket',
    category: 'transactional',
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="padding: 40px 30px; text-align: center; background-color: #111827;"><h1 style="color: #ffffff; margin: 0;">SUCCESS+</h1></td></tr>
    <tr><td style="padding: 40px 30px;"><h2 style="color: #111827; margin: 0 0 20px 0;">New Reply on Ticket #{{ticketNumber}}</h2><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p><p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">We've replied to your support ticket.</p><div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;"><p style="margin: 0; color: #6b7280; white-space: pre-wrap;">{{replyMessage}}</p></div><a href="{{ticketUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Conversation</a></td></tr>
    <tr><td style="padding: 30px; background-color: #f9fafb; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;">SUCCESS Magazine</p></td></tr>
  </table>
</body>
</html>`,
    variables: ['firstName', 'ticketNumber', 'replyMessage', 'ticketUrl'],
  },
];

async function main() {
  console.log('Seeding default email templates...');

  for (const template of defaultTemplates) {
    const templateId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO email_templates (
        id, name, subject, preview_text, html_content, category, variables, is_active, created_by
      ) VALUES (
        ${templateId},
        ${template.name},
        ${template.subject},
        ${template.previewText},
        ${template.htmlContent},
        ${template.category},
        ${JSON.stringify(template.variables)}::jsonb,
        true,
        'system'
      )
      ON CONFLICT DO NOTHING
    `;

    console.log(`✓ Created template: ${template.name}`);
  }

  console.log('✅ Email templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding email templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
