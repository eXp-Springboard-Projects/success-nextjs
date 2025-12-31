# Email System Setup Instructions

## Overview
The email system is configured and ready to send emails using **Resend**. The code is in place, but you need to add your Resend API credentials to activate it.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@success.com
```

## How to Get Your Resend API Key

1. **Sign up for Resend** (if you haven't already):
   - Go to https://resend.com
   - Create an account or sign in

2. **Create an API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name like "SUCCESS Production"
   - Copy the API key (it starts with `re_`)

3. **Verify Your Domain** (Important!):
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Add `success.com`
   - Follow DNS verification steps
   - Once verified, you can send from `@success.com` addresses

4. **Set Your From Email**:
   - Use `noreply@success.com` or another verified email
   - Make sure the domain is verified in Resend

## Update .env.local

Open `.env.local` and add:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@success.com
```

## Test the Email System

After adding the credentials, run:

```bash
npm run dev
npx tsx scripts/send-test-emails.ts
```

This will send test emails to:
- rachel.nead@success.com
- rachel.nead@exprealty.net

## Email Capabilities

Once configured, the system can send:

### Transactional Emails
- Password reset emails
- Staff welcome emails
- Invite codes
- Newsletter confirmations
- Subscription receipts

### CRM Emails
- Email campaigns
- Automated email sequences
- Drip campaigns
- Newsletters

### Functions Available

```typescript
// lib/resend-email.ts
sendMail(to, subject, html)
sendPasswordResetEmail(email, name, resetUrl)
sendStaffWelcomeEmail(email, name, tempPassword)
sendInviteCodeEmail(email, inviteCode, invitedByName)
sendNewsletterWelcomeEmail(email)
sendSubscriptionReceiptEmail(email, name, plan, amount, receiptUrl)
```

## Alternative: AWS SES

If you prefer to use AWS SES instead of Resend, the system also supports it:

```env
# AWS SES Configuration (alternative to Resend)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@success.com
```

The SES integration is in `lib/email/ses.ts`.

## Troubleshooting

### "Email service not configured" error
- Check that RESEND_API_KEY is set in .env.local
- Check that RESEND_FROM_EMAIL is set
- Restart the dev server after adding env vars

### Emails not delivering
- Verify your domain in Resend dashboard
- Check that the from email matches your verified domain
- Check Resend logs: https://resend.com/emails
- Check spam folder

### DNS Verification Issues
- Make sure you add all required DNS records
- Wait 24-48 hours for DNS propagation
- Use `nslookup` or `dig` to verify DNS records

## Production Deployment

For production (Vercel):

1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - `RESEND_API_KEY` = your production API key
   - `RESEND_FROM_EMAIL` = noreply@success.com
4. Redeploy the application

## Email Templates

Email templates are in:
- `lib/resend-email.ts` - Pre-built transactional emails
- CRM email templates will use the `email_templates` table (once migration is run)

All emails include:
- SUCCESS branding (red #d32f2f)
- Responsive HTML design
- Professional styling
- Unsubscribe links (for marketing emails)

## Next Steps

1. ✅ Get Resend API key
2. ✅ Add credentials to .env.local
3. ✅ Verify domain in Resend
4. ✅ Run test emails script
5. ✅ Check both inboxes for test emails
6. ✅ Configure CRM email campaigns
7. ✅ Set up automated sequences

## Files Created

- ✅ `pages/api/test-email.ts` - Test email API endpoint
- ✅ `scripts/send-test-emails.ts` - Test email script
- ✅ `lib/resend-email.ts` - Email functions (already existed)
- ✅ `lib/email/ses.ts` - AWS SES integration (already existed)
