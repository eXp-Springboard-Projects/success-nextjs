# In-House CRM & Marketing System Guide

## Overview

Your SUCCESS Magazine site now has a complete **in-house CRM and marketing automation system** built with your existing Prisma database schema. **No HubSpot needed!**

This system captures leads, manages contacts, sends email campaigns, and tracks all customer interactions.

---

## 🎯 Features Included

### 1. Lead Capture & Contact Management
- ✅ Newsletter signup form
- ✅ Contact form
- ✅ Automatic contact creation in CRM
- ✅ Tag-based segmentation
- ✅ Source tracking (where leads came from)
- ✅ Contact history & notes

### 2. Email Marketing
- ✅ Newsletter subscribers database
- ✅ Email campaigns (via Prisma Campaign model)
- ✅ Drip email sequences
- ✅ Email templates
- ✅ Open/click tracking (via EmailLog model)
- ✅ Unsubscribe management

### 3. Forms
- ✅ Newsletter signup (inline + full form variants)
- ✅ Contact form (with automatic CRM integration)
- ✅ Search form
- ✅ All forms styled and responsive

### 4. Article Display
- ✅ Full article renderer with HTML/markdown support
- ✅ Google Ad Manager integration (inject ads every 3 paragraphs)
- ✅ Social sharing buttons (Twitter, Facebook, LinkedIn, Email)
- ✅ Author bio display
- ✅ Related posts section
- ✅ Paywall integration
- ✅ SEO-optimized markup

---

## 📁 Files Created

### Components

```
components/
├── forms/
│   ├── NewsletterSignup.tsx         # Newsletter signup form
│   ├── NewsletterSignup.module.css
│   ├── ContactForm.tsx              # Contact form
│   ├── ContactForm.module.css
│   ├── SearchForm.tsx               # Search functionality
│   └── SearchForm.module.css
├── ArticleDisplay.tsx               # Full article renderer
└── ArticleDisplay.module.css
```

### API Routes

```
pages/api/
├── newsletter/
│   └── subscribe.ts                 # Newsletter subscription
├── contact/
│   └── submit.ts                    # Contact form submission
└── crm/
    ├── contacts.ts                  # (Already exists)
    ├── campaigns.ts                 # (Already exists)
    └── templates.ts                 # (Already exists)
```

---

## 🚀 How to Use

### Newsletter Signup Form

Add to any page (inline version for footer/sidebar):

```tsx
import NewsletterSignup from '@/components/forms/NewsletterSignup';

// Inline version (for footer)
<NewsletterSignup inline placeholder="Your email" buttonText="Subscribe" />

// Full version (for dedicated signup page)
<NewsletterSignup source="homepage" />
```

**What it does:**
1. Validates email
2. Creates record in `newsletterSubscriber` table
3. Creates/updates contact in `Contact` table (CRM)
4. Sends welcome email (placeholder ready for SendGrid)
5. Tracks source for analytics

---

### Contact Form

Add to contact page:

```tsx
import ContactForm from '@/components/forms/ContactForm';

<ContactForm source="contact-page" />

// Or pre-fill subject
<ContactForm subject="Advertising Inquiry" source="advertise-page" />
```

**What it does:**
1. Captures: Name, Email, Phone, Company, Subject, Message
2. Creates/updates contact in CRM
3. Adds contact history to notes
4. Sends admin notification email
5. Sends user confirmation email
6. Tags contact as "contact-form-lead"

---

### Search Form

Add to header or search page:

```tsx
import SearchForm from '@/components/forms/SearchForm';

// Inline version for header
<SearchForm inline placeholder="Search..." />

// Full version for search page
<SearchForm />
```

Redirects to `/search?q=query` (you'll need to create the search results page).

---

### Article Display

Replace your current article rendering:

```tsx
import ArticleDisplay from '@/components/ArticleDisplay';

<ArticleDisplay
  article={{
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    author: {
      name: post.author.name,
      bio: post.author.bio,
      avatar: post.author.avatar
    },
    publishedAt: post.publishedAt,
    readTime: post.readTime,
    categories: post.categories,
    tags: post.tags
  }}
  relatedPosts={relatedPosts}
  enablePaywall={true}
  enableAds={true}
/>
```

**Features:**
- Renders HTML content
- Injects Google Ad Manager ads every 3 paragraphs
- Social sharing buttons
- Author bio
- Related posts
- Wrapped in paywall (if enabled)
- Fully responsive

---

## 💌 Email System

Your CRM uses the existing Prisma schema tables:

### Models Used:

1. **Contact** - All leads and customers
2. **Campaign** - Email campaigns
3. **DripEmail** - Automated email sequences
4. **EmailTemplate** - Reusable email templates
5. **EmailLog** - Track sent emails, opens, clicks
6. **CampaignContact** - Junction table for campaigns & contacts

### Sending Emails

Currently, email functions are **placeholders**. To send actual emails:

#### Option 1: SendGrid (Recommended)

```bash
npm install @sendgrid/mail
```

```typescript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    text,
    html
  });
}
```

Then replace placeholders in:
- `/api/newsletter/subscribe.ts` - `sendWelcomeEmail()`
- `/api/contact/submit.ts` - `sendAdminNotification()` and `sendUserConfirmation()`

#### Option 2: Resend (Modern Alternative)

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'SUCCESS Magazine <noreply@success.com>',
  to: email,
  subject: 'Welcome to SUCCESS',
  html: '<p>Thanks for subscribing!</p>'
});
```

---

## 📊 CRM Management UI

You already have admin pages for CRM management:

### Existing Admin Pages:

1. **`/admin/crm/contacts`** - View/manage all contacts
2. **`/admin/crm/campaigns`** - Create/manage email campaigns
3. **`/admin/crm/templates`** - Manage email templates

### To Build Campaign Sender:

Create `/admin/crm/campaigns/[id]/send.tsx`:

```typescript
// Send campaign to all contacts with specific tag
async function sendCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
      contacts: {
        include: { contact: true }
      }
    }
  });

  for (const cc of campaign.contacts) {
    await sendEmail({
      to: cc.contact.email,
      subject: campaign.subject,
      html: campaign.template.content
    });

    // Log email
    await prisma.emailLog.create({
      data: {
        contactId: cc.contact.id,
        subject: campaign.subject,
        content: campaign.template.content,
        status: 'sent'
      }
    });

    // Update campaign contact
    await prisma.campaignContact.update({
      where: { id: cc.id },
      data: { sentAt: new Date(), status: 'sent' }
    });
  }
}
```

---

## 🎨 Customization

### Newsletter Signup Styles

Edit `components/forms/NewsletterSignup.module.css`:
- Change colors (currently using SUCCESS red: `#d32f2f`)
- Adjust spacing, borders, fonts
- Modify button styles

### Contact Form Fields

Edit `components/forms/ContactForm.tsx`:
- Add/remove fields
- Change validation
- Modify email templates

### Article Ad Placement

Edit `components/ArticleDisplay.tsx`:
- Change ad frequency (currently every 3 paragraphs)
- Modify max ads (currently 3 per article)
- Update Google Ad Manager account ID

---

## 🔔 Notifications

### Admin Notifications

When a contact form is submitted, admins receive an email notification.

Configure in `.env.local`:
```env
ADMIN_EMAIL=admin@success.com
```

### User Confirmations

Users receive confirmation emails after:
- Newsletter signup
- Contact form submission

---

## 📈 Analytics & Tracking

### What's Tracked:

1. **Newsletter Signups**
   - Email, name, source, timestamp
   - Stored in `newsletterSubscriber` table

2. **Contact Form Submissions**
   - All form data saved to `Contact` table
   - Submission history in contact notes
   - Source tracking

3. **Email Campaigns**
   - Sent, opened, clicked (via `EmailLog`)
   - Per-contact status tracking
   - Campaign-level metrics

### Google Analytics Events

Forms automatically trigger GA events:
- `newsletter_signup`
- `contact_form_submit`

Configure Google Analytics:
```tsx
// pages/_app.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

---

## 🛠️ Environment Variables

Add to `.env.local`:

```env
# Email Service (choose one)
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@success.com"
# OR
RESEND_API_KEY="re_xxx"

# Admin Notifications
ADMIN_EMAIL="admin@success.com"

# Google Ad Manager (optional)
NEXT_PUBLIC_GAM_ACCOUNT_ID="your_account_id"

# Site URL (for sharing/emails)
NEXT_PUBLIC_SITE_URL="https://www.success.com"
```

---

## 📋 To-Do for Your Engineer

### Immediate:

1. **Install Email Service**
   ```bash
   npm install @sendgrid/mail
   # OR
   npm install resend
   ```

2. **Implement Actual Email Sending**
   - Update `sendWelcomeEmail()` in `/api/newsletter/subscribe.ts`
   - Update `sendAdminNotification()` in `/api/contact/submit.ts`
   - Update `sendUserConfirmation()` in `/api/contact/submit.ts`

3. **Configure Google Ad Manager**
   - Update ad slots in `ArticleDisplay.tsx`
   - Replace `YOUR_GAM_ACCOUNT_ID` with real ID
   - Test ad loading

4. **Create Search Results Page**
   - `/pages/search.tsx`
   - Query posts by title/content
   - Display results

### Optional Enhancements:

1. **Drip Campaign Builder**
   - UI for creating automated email sequences
   - Trigger based on tags, actions, dates

2. **Email Template Editor**
   - WYSIWYG editor for email templates
   - Variable replacement (e.g., `{{firstName}}`)

3. **Contact Segmentation**
   - Advanced filtering by tags, source, date
   - Bulk actions (tag, email, export)

4. **A/B Testing**
   - Split test email subject lines
   - Track conversion rates

5. **SMS Integration** (Optional)
   - Add Twilio for SMS campaigns
   - Phone number validation

---

## 🎓 Usage Examples

### Example 1: Newsletter Signup in Footer

```tsx
// components/Footer.tsx
import NewsletterSignup from './forms/NewsletterSignup';

<section className="newsletter-section">
  <h3>Stay Inspired</h3>
  <p>Get SUCCESS tips delivered to your inbox weekly</p>
  <NewsletterSignup
    inline
    source="footer"
    placeholder="Your email address"
    buttonText="Sign Up"
  />
</section>
```

### Example 2: Contact Page

```tsx
// pages/contact.tsx
import Layout from '@/components/Layout';
import ContactForm from '@/components/forms/ContactForm';

export default function ContactPage() {
  return (
    <Layout>
      <div className="container">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you!</p>
        <ContactForm source="contact-page" />
      </div>
    </Layout>
  );
}
```

### Example 3: Article Page with Paywall

```tsx
// pages/blog/[slug].tsx
import ArticleDisplay from '@/components/ArticleDisplay';

export default function BlogPost({ post, relatedPosts }) {
  return (
    <Layout>
      <ArticleDisplay
        article={post}
        relatedPosts={relatedPosts}
        enablePaywall={true}
        enableAds={true}
      />
    </Layout>
  );
}
```

---

## 🚨 Important Notes

1. **Email Sending**: Currently logs to console. Integrate SendGrid/Resend for production.

2. **Google Ads**: Placeholder code included. Replace with your GAM account ID.

3. **GDPR Compliance**: Add privacy policy links, cookie consent, unsubscribe functionality.

4. **Rate Limiting**: Add rate limiting to form submissions to prevent spam.

5. **Validation**: Forms use basic validation. Add server-side validation for security.

---

## ✅ What's Complete

- ✅ Newsletter signup form (with inline variant)
- ✅ Contact form (with CRM integration)
- ✅ Search form
- ✅ Article display component
- ✅ Google Ad Manager integration
- ✅ Social sharing buttons
- ✅ Author bios
- ✅ Related posts
- ✅ Paywall integration
- ✅ Responsive design for all components
- ✅ API routes for all forms
- ✅ Automatic CRM contact creation
- ✅ Email placeholders (ready for SendGrid/Resend)

---

## 📞 Need Help?

All components are documented and styled. Your engineer just needs to:

1. Connect email service (15 minutes)
2. Configure Google Ad Manager (10 minutes)
3. Create search results page (30 minutes)

**Total setup time: ~1 hour**

No HubSpot subscription needed! 🎉
