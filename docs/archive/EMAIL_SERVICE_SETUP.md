# Email Service Setup Guide (SendGrid)

## 🎯 Goal
Enable your Next.js site to send emails for:
- Password resets
- Staff welcome emails
- Newsletter confirmations
- Email campaigns
- User notifications

Currently: **No emails sent**
After setup: **Full email functionality**

---

## 📋 Why SendGrid?

✅ **Free tier:** 100 emails/day forever
✅ **Easy setup:** 10 minutes
✅ **Reliable:** 99.9% deliverability
✅ **No credit card required** for free tier

**Alternatives:** AWS SES (cheaper at scale), Mailgun, Postmark

---

## 🚀 Step 1: Create SendGrid Account

1. **Go to SendGrid**
   - Visit: https://signup.sendgrid.com/

2. **Sign Up for Free**
   - Email: rachel.nead@success.com
   - Create password
   - Plan: Free (100 emails/day)

3. **Verify Your Email**
   - Check your inbox
   - Click verification link

4. **Complete Onboarding**
   - Tell them you're using it for transactional emails
   - Skip the detailed questionnaire (you can always go back)

---

## 🔑 Step 2: Create API Key

1. **Go to API Keys Page**
   - SendGrid Dashboard → Settings → API Keys
   - URL: https://app.sendgrid.com/settings/api_keys

2. **Create API Key**
   - Click "Create API Key"
   - Name: `SUCCESS Magazine Next.js`
   - Permissions: **Full Access** (simplest for now)
   - Click "Create & View"

3. **SAVE THE API KEY**
   - Copy the key immediately (starts with `SG.`)
   - **You won't be able to see it again!**
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 📧 Step 3: Verify Sender Email

SendGrid requires you to verify the email address you'll send FROM.

### Option A: Single Sender Verification (Easiest - 2 minutes)

1. **Go to Sender Authentication**
   - SendGrid Dashboard → Settings → Sender Authentication
   - URL: https://app.sendgrid.com/settings/sender_auth

2. **Verify Single Sender**
   - Click "Verify a Single Sender"
   - Fill in form:
     ```
     From Name: SUCCESS Magazine
     From Email Address: noreply@success.com
     Reply To: contact@success.com (or rachel.nead@success.com)
     Company Address: [Your business address]
     Nickname: SUCCESS Magazine
     ```
   - Click "Create"

3. **Check Email**
   - SendGrid sends verification email to `noreply@success.com`
   - Click the verification link in that email

4. **Verify** ✅ Done!

### Option B: Domain Authentication (Better for Production)

**Use this if you want emails from @success.com domain**

1. **Go to Sender Authentication**
   - SendGrid Dashboard → Settings → Sender Authentication

2. **Authenticate Your Domain**
   - Click "Authenticate Your Domain"
   - DNS Host: Select your DNS provider (e.g., Cloudflare, GoDaddy)
   - Domain: `success.com`

3. **Add DNS Records**
   - SendGrid gives you 3 DNS records (CNAME records)
   - Add these to your DNS provider:
     ```
     CNAME em1234._domainkey.success.com → em1234.sendgrid.net
     CNAME s1._domainkey.success.com → s1.sendgrid.net
     CNAME s2._domainkey.success.com → s2.sendgrid.net
     ```

4. **Verify Domain**
   - Click "Verify" in SendGrid
   - May take up to 48 hours for DNS propagation
   - Usually works in 10-30 minutes

---

## 🔧 Step 4: Add to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - https://vercel.com/
   - Navigate to your project: `success-nextjs`

2. **Open Environment Variables**
   - Settings → Environment Variables

3. **Add SendGrid Configuration**

```
Name: SENDGRID_API_KEY
Value: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production, Preview, Development
```

```
Name: SENDGRID_ENABLED
Value: true
Environment: Production, Preview, Development
```

```
Name: EMAIL_FROM
Value: noreply@success.com
Environment: Production, Preview, Development
```

```
Name: EMAIL_FROM_NAME
Value: SUCCESS Magazine
Environment: Production, Preview, Development
```

4. **Save All Variables**

---

## 💻 Step 5: Add to Local Environment (Optional)

Create or update `.env.local`:

```bash
# SendGrid Email Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_ENABLED=true
EMAIL_FROM=noreply@success.com
EMAIL_FROM_NAME=SUCCESS Magazine
```

---

## 📦 Step 6: Install SendGrid Package

```bash
npm install @sendgrid/mail
```

---

## 📝 Step 7: Create Email Utility

Create file: `lib/email.ts`

```typescript
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@success.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'SUCCESS Magazine';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid not configured');
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    console.log('Email sent:', { to, subject });
    return true;
  } catch (error: any) {
    console.error('Email error:', error.response?.body || error.message);
    return false;
  }
}

// Password reset email
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - SUCCESS Magazine',
    html
  });
}

// Staff welcome email
export async function sendStaffWelcomeEmail(email: string, name: string, tempPassword: string) {
  const loginUrl = process.env.NEXTAUTH_URL + '/admin/login';

  const html = `
    <h1>Welcome to SUCCESS Magazine!</h1>
    <p>Hi ${name},</p>
    <p>Your account has been created:</p>
    <p><strong>Email:</strong> ${email}<br>
    <strong>Password:</strong> ${tempPassword}</p>
    <p><a href="${loginUrl}">Login Now</a></p>
    <p>You must change your password on first login.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Your SUCCESS Magazine Admin Account',
    html
  });
}

// Newsletter welcome
export async function sendNewsletterWelcome(email: string) {
  const html = `
    <h1>Welcome to SUCCESS Magazine!</h1>
    <p>Thank you for subscribing to our newsletter.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SUCCESS Magazine Newsletter!',
    html
  });
}
```

---

## 🧪 Step 8: Test Email System

### Create Test Endpoint

Create file: `pages/api/email/test.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Email address required' });
  }

  const html = `
    <h1>✅ Email System Test</h1>
    <p>Your SendGrid integration is working!</p>
    <p>Sent at: ${new Date().toISOString()}</p>
  `;

  const success = await sendEmail({
    to,
    subject: 'SUCCESS Magazine - Email Test',
    html
  });

  if (success) {
    return res.status(200).json({ success: true, message: 'Email sent!' });
  } else {
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}
```

### Test It

```bash
# Deploy first
git add .
git commit -m "Add SendGrid email integration"
git push

# Then test with curl or Postman
curl -X POST https://your-site.vercel.app/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"rachel.nead@success.com"}'
```

Or create a simple test page in admin.

---

## 🚀 Step 9: Update Auth Endpoints to Send Emails

### Update Password Reset Endpoint

Edit `pages/api/auth/forgot-password.ts`:

```typescript
import { sendPasswordResetEmail } from '../../../lib/email';

// Inside your handler, after generating reset token:
const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
await sendPasswordResetEmail(user.email, resetUrl);
```

### Update Staff Registration

Edit `pages/api/auth/register.ts`:

```typescript
import { sendStaffWelcomeEmail } from '../../../lib/email';

// After creating user:
await sendStaffWelcomeEmail(user.email, user.name, DEFAULT_PASSWORD);
```

### Update Newsletter Subscription

Edit `pages/api/newsletter/subscribe.ts`:

```typescript
import { sendNewsletterWelcome } from '../../../lib/email';

// After subscribing:
await sendNewsletterWelcome(email);
```

---

## 📊 What This Unlocks

After successful setup:

### Authentication Emails
- ✅ Password reset emails
- ✅ Welcome emails for new staff
- ✅ Account verification emails

### Marketing Emails
- ✅ Newsletter subscription confirmations
- ✅ Email campaigns to subscribers
- ✅ Drip email sequences

### Transactional Emails
- ✅ Order confirmations
- ✅ Subscription updates
- ✅ Payment receipts

### Admin Notifications
- ✅ New comment notifications
- ✅ New member signups
- ✅ System alerts

---

## 🔍 Troubleshooting

### Issue: "Unauthorized" error

**Solutions:**
- Verify SendGrid API key is correct
- Check API key has "Full Access" permissions
- Regenerate API key if needed

### Issue: Emails not arriving

**Solutions:**
- Check spam/junk folder
- Verify sender email is verified in SendGrid
- Check SendGrid Activity Feed for delivery status
- Make sure from email matches verified sender

### Issue: "Sender address rejected"

**Solutions:**
- Complete Single Sender Verification in SendGrid
- Or complete Domain Authentication
- Make sure `EMAIL_FROM` matches verified address

### Check SendGrid Activity Feed

1. Go to: https://app.sendgrid.com/email_activity
2. See all sent emails and their status
3. Check for bounces or blocks

---

## 💰 SendGrid Pricing

**Free Tier:**
- 100 emails/day forever
- Perfect for getting started
- No credit card required

**Essentials Plan: $19.95/month**
- 50,000 emails/month
- Better for production

**Pro Plan: $89.95/month**
- 100,000 emails/month
- Advanced features

**Start with Free tier, upgrade when needed!**

---

## 🔐 Security Best Practices

✅ **DO:**
- Keep API key in environment variables only
- Use separate API keys for dev/staging/production
- Monitor SendGrid activity for suspicious sends
- Set up domain authentication for production

❌ **DON'T:**
- Commit API key to git
- Share API key
- Use same API key across multiple apps
- Send marketing emails without unsubscribe links

---

## 🎉 Success Checklist

- [ ] SendGrid account created
- [ ] API key generated and saved
- [ ] Sender email verified
- [ ] Environment variables added to Vercel
- [ ] SendGrid package installed (`npm install @sendgrid/mail`)
- [ ] Email utility created (`lib/email.ts`)
- [ ] Test email sent successfully
- [ ] Password reset emails working
- [ ] Staff welcome emails working

---

## 📞 Quick Reference

**SendGrid Dashboard:**
https://app.sendgrid.com/

**API Keys:**
https://app.sendgrid.com/settings/api_keys

**Sender Authentication:**
https://app.sendgrid.com/settings/sender_auth

**Email Activity Feed:**
https://app.sendgrid.com/email_activity

**SendGrid Documentation:**
https://docs.sendgrid.com/

---

## ⏱️ Time Estimate

- Create SendGrid account: 3 minutes
- Generate API key: 1 minute
- Verify sender email: 2 minutes
- Add to Vercel: 2 minutes
- Install package: 1 minute
- Create email utility: 5 minutes
- Update endpoints: 10 minutes
- Testing: 5 minutes

**Total: ~30 minutes**

---

**After completing this, move on to Stripe integration!**
