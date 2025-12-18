# 🚀 Email Service Quick Start - Get Emails Working in 20 Minutes

**PROBLEM**: Emails not sending - all email services are empty in production.

**SOLUTION**: Enable AWS SES (free for 62k emails/month, $0.10 per 1k after).

---

## ⚡ FASTEST PATH (20 minutes)

### **Option 1: AWS SES** (RECOMMENDED - Free & Production-Ready)

**Step 1: Get AWS Credentials** (5 min)

1. Go to https://console.aws.amazon.com/iam/
2. Click "Users" → Select your user (or create one)
3. Click "Security credentials" → "Create access key"
4. Select "Application running on AWS compute service"
5. Copy:
   - Access key ID: `AKIA...`
   - Secret access key: `...` (shown once!)

**Step 2: Add to Vercel** (5 min)

1. Go to https://vercel.com/dashboard
2. Select project: `success-nextjs`
3. Settings → Environment Variables
4. Add these variables:

```bash
AWS_SES_ENABLED = true
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = AKIA... (from Step 1)
AWS_SECRET_ACCESS_KEY = ... (from Step 1)
SES_FROM_EMAIL = hello@success.com
```

**Step 3: Verify Domain in AWS SES** (10 min)

1. Go to https://console.aws.amazon.com/ses/
2. Click "Verified identities" → "Create identity"
3. Select "Domain" → Enter `success.com`
4. Add the 3 DNS records AWS provides to your DNS
5. Wait 5-10 min for verification ✅

**Step 4: Request Production Access** (24-48h wait)

1. AWS SES → "Request production access"
2. Fill form:
   ```
   Mail type: Transactional
   Use case: "Transactional emails and marketing newsletters
             for SUCCESS Magazine subscribers"
   ```
3. Submit → Wait for approval email

**Step 5: Test!** (2 min)

While waiting for production access, test with your own email:
1. AWS SES → Verified identities → Create identity
2. Select "Email address" → Enter your email
3. Check inbox → Click verify link
4. Go to `/admin/crm/campaigns/new` → Send test to your email
5. ✅ Works!

---

### **Option 2: Resend** (Quick Setup - $20/month after 3k emails)

**Step 1: Get API Key** (2 min)

1. Go to https://resend.com/signup
2. Create account
3. Add domain: `success.com`
4. Get API key: https://resend.com/api-keys
5. Copy: `re_...`

**Step 2: Add to Vercel** (2 min)

```bash
RESEND_API_KEY = re_... (from Step 1)
AWS_SES_ENABLED = false
```

**Step 3: Verify Domain** (5 min)

1. Resend dashboard → Domains → Add DNS records
2. Wait 2-5 min for verification

**Step 4: Test!** (1 min)

- Go to `/admin/crm/campaigns/new`
- Send test email
- ✅ Works!

---

### **Option 3: SendGrid** (Similar to Resend)

**Step 1: Get API Key** (3 min)

1. Go to https://signup.sendgrid.com/
2. Create account (requires phone verification)
3. Settings → API Keys → Create
4. Copy: `SG.`

**Step 2: Add to Vercel** (2 min)

```bash
SENDGRID_API_KEY = SG.... (from Step 1)
SENDGRID_FROM_EMAIL = hello@success.com
AWS_SES_ENABLED = false
RESEND_API_KEY = (leave empty)
```

**Step 3: Verify Sender** (5 min)

1. SendGrid → Settings → Sender Authentication
2. Verify single sender → Add email
3. Check inbox → Click verify

**Step 4: Test!**

- Send test from CRM
- ✅ Works!

---

## 📊 Cost Comparison

| Service | Free Tier | After Free Tier | Best For |
|---------|-----------|-----------------|----------|
| **AWS SES** | 62k/mo | $0.10 per 1k | **High volume** |
| **Resend** | 3k/mo | $20/mo (50k) | Quick setup |
| **SendGrid** | 100/day | $20/mo (50k) | Established brand |

**Recommendation:**
- **Under 10k emails/month**: Any service works
- **10k-100k emails/month**: AWS SES (saves $200+/year)
- **100k+ emails/month**: AWS SES (saves $1,000+/year)

---

## 🧪 Testing Checklist

After setup, test these:

- [ ] Send test email from `/admin/crm/campaigns/new`
- [ ] Test email arrives in inbox (not spam)
- [ ] Unsubscribe link works
- [ ] Send to 5+ addresses successfully
- [ ] Check email delivery dashboard (AWS/Resend/SendGrid)
- [ ] Verify bounce handling configured

---

## 🚨 Troubleshooting

### Issue: Emails not sending

**Check Vercel Logs:**
```bash
vercel logs success-nextjs --follow
```

Look for errors like:
- "Email service not configured" → Add API keys
- "AWS AccessDenied" → Check AWS credentials
- "Domain not verified" → Complete domain verification

### Issue: Emails go to spam

**Fix:**
1. Verify domain (SPF, DKIM records)
2. Add unsubscribe link (already done in code)
3. Start with small volume, increase gradually
4. Monitor bounce rate (keep < 5%)

### Issue: AWS SES sandbox mode

**Solution:**
- Request production access (Step 4 above)
- While waiting, verify recipient emails in SES
- Can send to verified emails in sandbox

---

## 📞 Need Help?

**AWS SES:** Full guide in `docs/AWS_SES_SETUP.md`

**Resend:** https://resend.com/docs

**SendGrid:** https://docs.sendgrid.com

---

## ✅ What's Already Built

Your codebase has **everything ready**:
- ✅ Email sending infrastructure (`lib/email.ts`)
- ✅ AWS SES integration (`lib/email/ses.ts`)
- ✅ Bounce/complaint handling
- ✅ Unsubscribe links
- ✅ Click tracking
- ✅ Open tracking
- ✅ CRM integration

**Just add the API keys and you're live!** 🚀
