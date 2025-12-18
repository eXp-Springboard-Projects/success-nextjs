# AWS SES Email Setup Guide

Complete guide to enable AWS Simple Email Service (SES) for the SUCCESS Magazine CRM.

---

## 🎯 Why Use AWS SES?

**Cost Comparison:**
- **AWS SES**: $0.10 per 1,000 emails = $1 per 10,000 emails
- **Resend**: $20/month for 50,000 emails
- **SendGrid**: ~$20/month for 50,000 emails

**AWS SES Benefits:**
- ✅ **90% cheaper** than alternatives at scale
- ✅ **3,000 free emails/month** when hosted on AWS (Amplify qualifies!)
- ✅ **Unlimited scalability** - send millions of emails
- ✅ **Full tracking** - opens, clicks, bounces, complaints
- ✅ **Already implemented** - just enable and configure
- ✅ **No vendor lock-in** - standard SMTP protocol

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] AWS account with Amplify hosting
- [x] AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- [x] Access to success.com DNS settings
- [x] Domain email address (e.g., hello@success.com)

---

## 🚀 Setup Steps (30-45 minutes)

### **Step 1: Verify Your Domain** (15 minutes)

1. **Go to AWS SES Console**
   - https://console.aws.amazon.com/ses/
   - Select your region (e.g., `us-east-1`)

2. **Create Identity**
   - Click "Verified identities" → "Create identity"
   - Select "Domain"
   - Enter: `success.com`
   - Check "Assign a default configuration set" (optional)
   - Click "Create identity"

3. **Add DNS Records**
   - AWS will show 3 CNAME records to add
   - Copy each record to your DNS provider (Cloudflare, Route53, etc.)

   **Example DNS records:**
   ```
   Type: CNAME
   Name: _amazonses.success.com
   Value: [provided by AWS]

   Type: CNAME
   Name: [random]._domainkey.success.com
   Value: [provided by AWS]

   Type: CNAME
   Name: [random]._domainkey.success.com
   Value: [provided by AWS]
   ```

4. **Wait for Verification** (5-10 minutes)
   - DNS propagation takes 5-30 minutes
   - Status will change from "Pending" to "Verified"
   - Refresh the page to check status

---

### **Step 2: Request Production Access** (Submit request - 24-48h approval)

**IMPORTANT**: New AWS accounts start in "Sandbox Mode" which limits sending to verified emails only.

1. **Request Production Access**
   - AWS Console → SES → Account Dashboard
   - Click "Request production access"

2. **Fill Out Request Form**
   ```
   Mail type: Transactional
   Website URL: https://www.success.com

   Use case description:
   "SUCCESS Magazine uses AWS SES to send transactional emails and
   marketing newsletters to our subscribers. This includes:
   - Password reset emails
   - Subscription confirmations
   - Weekly newsletters to 10,000+ subscribers
   - CRM marketing campaigns

   We have proper unsubscribe mechanisms in place and maintain email
   best practices including double opt-in for marketing emails."

   Additional contacts: [your email]
   Preferred contact language: English
   Acknowledge compliance: ✓ Yes
   ```

3. **Submit and Wait**
   - AWS typically approves within 24-48 hours
   - You'll receive email confirmation
   - Meanwhile, you can test with verified emails in sandbox mode

---

### **Step 3: Configure Custom MAIL FROM Domain** (Optional - 10 minutes)

Improves deliverability and sender reputation.

1. **Set MAIL FROM Domain**
   - Go to verified identity (success.com)
   - Click "MAIL FROM domain" → "Edit"
   - Enter: `mail.success.com`
   - Click "Save changes"

2. **Add DNS Records**
   - AWS provides 2 more DNS records (MX and TXT)
   - Add these to your DNS provider

   **Example:**
   ```
   Type: MX
   Name: mail.success.com
   Value: 10 feedback-smtp.us-east-1.amazonses.com

   Type: TXT
   Name: mail.success.com
   Value: "v=spf1 include:amazonses.com ~all"
   ```

---

### **Step 4: Set Up Environment Variables** (5 minutes)

Add these to your `.env.local` (development) or Vercel environment variables (production):

```bash
# Enable AWS SES
AWS_SES_ENABLED=true

# AWS Region (must match where you verified domain)
AWS_REGION=us-east-1

# AWS Credentials (already set for S3/Amplify)
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx

# SES From Email (must be verified domain or email)
SES_FROM_EMAIL=hello@success.com
```

**In Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable above
3. Select "Production", "Preview", "Development" scopes
4. Click "Save"

---

### **Step 5: Test Email Sending** (10 minutes)

#### **Option A: Test via CRM (Recommended)**

1. Go to `/admin/crm/campaigns/new`
2. Click "Send Test Email"
3. Enter your email address
4. Check inbox for test email
5. ✅ Success! AWS SES is working

#### **Option B: Test via API**

```bash
curl -X POST https://your-domain.com/api/admin/crm/campaigns/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "AWS SES Test",
    "content": "<h1>Hello from AWS SES!</h1><p>Email sending works!</p>"
  }'
```

#### **Check AWS SES Dashboard**

1. Go to SES Console → Analytics
2. You should see:
   - ✅ Send rate chart showing 1 email
   - ✅ Delivery rate: 100%
   - ✅ No bounces or complaints

---

### **Step 6: Configure Bounce & Complaint Handling** (Optional - 15 minutes)

Automatically handle bounces and spam complaints.

1. **Create SNS Topics**
   ```bash
   # Bounce notifications
   aws sns create-topic --name ses-bounces

   # Complaint notifications
   aws sns create-topic --name ses-complaints
   ```

2. **Configure SES Notifications**
   - SES Console → Verified identities → success.com
   - Click "Notifications" → "Edit"
   - Bounce feedback: Select "ses-bounces" topic
   - Complaint feedback: Select "ses-complaints" topic
   - Click "Save changes"

3. **Subscribe to Topics**
   ```bash
   # Subscribe to bounces
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ses-bounces \
     --protocol https \
     --notification-endpoint https://your-domain.com/api/webhooks/ses/bounces

   # Subscribe to complaints
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ses-complaints \
     --protocol https \
     --notification-endpoint https://your-domain.com/api/webhooks/ses/complaints
   ```

4. **Webhook Handlers** (already implemented in `lib/email/ses.ts`)
   - `handleBounce()` - Marks contact as bounced
   - `handleComplaint()` - Unsubscribes contact

---

## 🧪 Testing Checklist

After setup, verify everything works:

- [ ] Domain verified in SES (status: "Verified")
- [ ] Production access approved (or testing with verified emails)
- [ ] Environment variables set (`AWS_SES_ENABLED=true`)
- [ ] Test email sends successfully
- [ ] Email appears in inbox (check spam folder)
- [ ] Unsubscribe link works
- [ ] Bounce handling configured (optional)
- [ ] SES dashboard shows send metrics

---

## 📊 Monitoring & Analytics

### **AWS SES Console**

Monitor email performance at: https://console.aws.amazon.com/ses/

**Key Metrics:**
- **Send Rate**: Emails sent over time
- **Bounce Rate**: Should be < 5%
- **Complaint Rate**: Should be < 0.1%
- **Delivery Rate**: Should be > 95%

### **Database Tracking**

Email sends are automatically tracked in the database:

```sql
-- View recent email sends
SELECT * FROM email_events
WHERE event IN ('sent', 'delivered', 'opened', 'clicked')
ORDER BY timestamp DESC
LIMIT 100;

-- Campaign performance
SELECT
  campaign_id,
  COUNT(*) FILTER (WHERE event = 'sent') as sent,
  COUNT(*) FILTER (WHERE event = 'opened') as opened,
  COUNT(*) FILTER (WHERE event = 'clicked') as clicked
FROM email_events
GROUP BY campaign_id;
```

---

## 🚨 Troubleshooting

### **Issue: Domain not verifying**

**Solution:**
1. Check DNS records are correctly added
2. Wait 30 minutes for DNS propagation
3. Use `dig` to verify records:
   ```bash
   dig _amazonses.success.com CNAME
   ```

### **Issue: Emails not sending**

**Checklist:**
- [ ] `AWS_SES_ENABLED=true` in environment
- [ ] AWS credentials valid and not expired
- [ ] Domain verified in SES
- [ ] From email matches verified domain
- [ ] Production access approved (or using verified email in sandbox)

**Debug:**
```bash
# Check environment variables
echo $AWS_SES_ENABLED
echo $AWS_REGION
echo $SES_FROM_EMAIL

# Check AWS credentials
aws sts get-caller-identity
```

### **Issue: Emails going to spam**

**Solutions:**
1. Set up MAIL FROM domain (Step 3)
2. Add DMARC record to DNS:
   ```
   Type: TXT
   Name: _dmarc.success.com
   Value: v=DMARC1; p=none; rua=mailto:dmarc@success.com
   ```
3. Warm up sending IP (gradually increase volume)
4. Ensure unsubscribe link is visible
5. Maintain low bounce/complaint rates

### **Issue: "Sandbox mode" limiting sends**

**Solution:**
- Submit production access request (Step 2)
- While waiting, verify recipient emails in SES to test

---

## 💰 Cost Breakdown

**Pricing Tiers:**
```
First 62,000 emails/month (via EC2/Amplify): FREE
After free tier: $0.10 per 1,000 emails

Examples:
- 10,000 emails/month: FREE
- 100,000 emails/month: $3.80/month
- 500,000 emails/month: $43.80/month
- 1,000,000 emails/month: $93.80/month
```

**Compare to:**
- Resend: $85/month for 100k emails
- SendGrid: $80/month for 100k emails

**Annual Savings (at 100k/month):**
- AWS SES: $45.60/year
- Resend: $1,020/year
- **You save: $974/year!**

---

## 🔄 Switching Back to Resend/SendGrid

If you need to switch back:

1. Set `AWS_SES_ENABLED=false` in environment
2. Ensure `RESEND_API_KEY` or `SENDGRID_API_KEY` is set
3. Restart application
4. Email sending will automatically fall back

The system checks providers in this order:
1. AWS SES (if enabled)
2. SendGrid (if API key set)
3. Resend (if API key set)

---

## 📞 Support

**AWS SES Documentation:**
- https://docs.aws.amazon.com/ses/

**Get Help:**
- AWS Support (if you have support plan)
- AWS SES Forum: https://forums.aws.amazon.com/forum.jspa?forumID=90
- SUCCESS Magazine DevOps team

**Common Issues:**
- Sandbox mode restrictions
- Domain verification
- Production access approval
- Bounce/complaint handling

---

## ✅ Setup Complete!

Your CRM now uses AWS SES for email sending with:
- ✅ 90% cost savings vs Resend/SendGrid
- ✅ Unlimited scalability
- ✅ Full bounce/complaint tracking
- ✅ Professional email deliverability
- ✅ Automatic unsubscribe handling

**Next Steps:**
1. Monitor SES dashboard daily for first week
2. Check bounce/complaint rates (should be < 5% / 0.1%)
3. Gradually increase send volume (if sending large campaigns)
4. Set up CloudWatch alarms for high bounce rates (optional)

Enjoy your production-ready, cost-effective email system! 🚀
