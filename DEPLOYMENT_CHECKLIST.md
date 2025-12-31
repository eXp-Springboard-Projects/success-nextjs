# Production Deployment Checklist

## ✅ Completed Items

### 1. API Integrations
- [x] Stripe SDK configured
- [x] Stripe API keys added to production
- [x] Resend email SDK configured
- [x] Resend API key added to production
- [x] Test email successfully sent
- [x] Supabase database connected

### 2. Error Pages
- [x] Custom 404 page created
- [x] Custom 500 page created

### 3. Email System
- [x] Password reset emails
- [x] Staff welcome emails
- [x] Invite code emails
- [x] Newsletter welcome emails
- [x] Subscription receipt emails
- [x] Generic email sender API

### 4. Admin Dashboard
- [x] Enhanced post editor with visual controls
- [x] Enhanced page editor with visual controls
- [x] TextStylePanel (14 fonts, colors, sizes)
- [x] BlockControls (layouts, galleries, videos)
- [x] Auto-save functionality
- [x] Media library picker
- [x] Image editor

---

## ⚠️ Missing/Incomplete Items

### Priority 1: Security & Critical

#### 1. Stripe Webhook Secret
**Status**: ❌ Not configured
**Impact**: HIGH - Webhook signature verification will fail

**Action Required**:
```bash
# Get secret from: Stripe Dashboard → Webhooks → Signing Secret
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_***
vercel --prod
```

#### 2. Configure Stripe Webhook Endpoint
**Status**: ⚠️ Needs configuration
**Impact**: HIGH - Subscriptions won't update in database

**Action Required**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://www.success.com/api/stripe/webhook`
4. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Save and copy the webhook signing secret
6. Add to Vercel (see step 1 above)

---

### Priority 2: Functionality

#### 3. C+W Magazine Fulfillment
**Status**: ❌ Not configured
**Impact**: MEDIUM - Insider tier magazine delivery won't work

**Action Required** (if using Insider tier with print magazine):
```bash
# Get from C+W fulfillment team
vercel env add CW_WEBHOOK_URL production
vercel env add CW_WEBHOOK_SECRET production
vercel --prod
```

**Skip if**: Not using print magazine fulfillment

#### 4. Supabase Database Tables
**Status**: ⚠️ May need manual creation
**Impact**: MEDIUM - Page overrides won't work

**Action Required**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL in `CREATE_PAGE_OVERRIDES_TABLE.sql`
3. Verify table created: `page_overrides`

#### 5. Consolidate Webhook Endpoints
**Status**: ⚠️ Two duplicate handlers exist
**Impact**: LOW - Potential confusion

**Action Required**:
- Choose ONE webhook endpoint (recommended: `/api/stripe/webhook`)
- Document which one to use in Stripe Dashboard
- See `WEBHOOK_SETUP.md` for details

---

### Priority 3: Enhancement (Optional)

#### 6. Stripe Customer Portal
**Status**: ❌ Not implemented
**Impact**: LOW - Users can't self-manage billing

**Action Required** (optional):
1. Create API endpoint: `pages/api/stripe/create-portal.ts`
2. Use existing `createPortalSession()` from `lib/stripe.ts`
3. Add "Manage Billing" button to account page

#### 7. Error Tracking
**Status**: ❌ Not configured
**Impact**: LOW - Harder to debug production issues

**Action Required** (optional):
- Install Sentry: `npm install @sentry/nextjs`
- Configure Sentry DSN
- Add to `next.config.js`

#### 8. Environment Variable Validation
**Status**: ⚠️ Some APIs fail silently
**Impact**: LOW - Harder to debug missing config

**Action Required** (optional):
- Add startup validation script
- Check all required env vars at build time
- Fail fast with clear error messages

---

## Production URLs

- **Live Site**: https://www.success.com
- **Vercel Project**: success-nextjs-7vxa
- **Supabase**: https://aczlassjkbtwenzsohwm.supabase.co
- **Admin Dashboard**: https://www.success.com/admin

---

## Testing Checklist

Before going live with payments:

### Stripe Integration
- [ ] Test checkout flow in test mode
- [ ] Verify webhook signature validation
- [ ] Confirm subscription created in database
- [ ] Check email sent to customer
- [ ] Test subscription update
- [ ] Test subscription cancellation
- [ ] Verify payment failure handling

### Email System
- [ ] Test password reset email
- [ ] Test welcome email for new users
- [ ] Test generic email sender API
- [ ] Verify all emails render correctly
- [ ] Check spam folder delivery

### Admin Dashboard
- [ ] Create new post with enhanced editor
- [ ] Create new page with enhanced editor
- [ ] Test all text styles (fonts, colors, sizes)
- [ ] Test all block layouts
- [ ] Upload images via drag-and-drop
- [ ] Test auto-save functionality
- [ ] Preview before publishing

---

## Monitoring

### Key Metrics to Watch

1. **Stripe Dashboard**
   - Successful payments
   - Failed payments
   - Webhook delivery status

2. **Vercel Analytics**
   - 404 errors
   - 500 errors
   - API response times

3. **Supabase Dashboard**
   - Database query performance
   - Active connections
   - Error logs

4. **Email Delivery (Resend)**
   - Delivery rate
   - Bounce rate
   - Open rate

---

## Emergency Contacts

- **Stripe Support**: https://support.stripe.com
- **Vercel Support**: https://vercel.com/support
- **Resend Support**: https://resend.com/support
- **Supabase Support**: https://supabase.com/support

---

## Rollback Plan

If something goes wrong after deployment:

1. **Revert to previous deployment**:
   ```bash
   vercel rollback
   ```

2. **Check deployment logs**:
   ```bash
   vercel logs
   ```

3. **Disable problematic feature**:
   - Remove environment variable
   - Redeploy

4. **Database rollback** (if needed):
   - Restore from Supabase backup
   - Contact Supabase support

---

## Next Steps

1. **Immediate** (today):
   - [ ] Add `STRIPE_WEBHOOK_SECRET` to production
   - [ ] Configure Stripe webhook endpoint
   - [ ] Test webhook delivery

2. **Short-term** (this week):
   - [ ] Run `CREATE_PAGE_OVERRIDES_TABLE.sql` in Supabase
   - [ ] Test full checkout flow end-to-end
   - [ ] Configure C+W fulfillment (if needed)

3. **Long-term** (future):
   - [ ] Add Stripe customer portal
   - [ ] Implement error tracking
   - [ ] Set up automated backups
   - [ ] Configure CDN for media files

---

**Last Updated**: December 29, 2025
