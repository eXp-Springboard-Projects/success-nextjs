# SUCCESS.com Admin Dashboard - User Guide

Welcome to the SUCCESS.com Admin Dashboard! This guide will help you navigate and use all features of the admin platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [SUCCESS+ Management](#success-management)
4. [Editorial Features](#editorial-features)
5. [Customer Service](#customer-service)
6. [Marketing & CRM](#marketing--crm)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Login

1. Navigate to `/admin/login`
2. Enter your credentials (email and password)
3. You'll be redirected to the main dashboard

**First-time users:** You'll be prompted to change your default password. Please create a strong password.

### Changing Your Password

1. Click your avatar in the sidebar
2. Select "Change Password"
3. Enter current password
4. Enter new password (minimum 8 characters)
5. Confirm new password

---

## Dashboard Overview

### Navigation Sidebar

The sidebar organizes features by department:

- **OVERVIEW** - Dashboard, Activity Feed, Announcements
- **SALES & CUSTOMER SERVICE** - Orders, Refunds, Subscriptions
- **SUCCESS.COM** - Editorial, Content, Media, SEO
- **SUCCESS+** - Courses, Events, Resources, Community
- **SUCCESS LABS** - External link to labs platform
- **CRM & EMAIL** - Contacts, Campaigns, Help Desk
- **MANAGEMENT** - Staff, Users, Permissions (Super Admin only)
- **CONFIGURATION** - Settings, Analytics, Site Monitor (Super Admin only)
- **DEVOPS & DEVELOPER** - System Health, Cache, Error Logs

**Tip:** Sections can be collapsed/expanded by clicking the section title. Your preferences are saved.

### Quick Actions

The homepage features quick action cards:

- **View Content** - Browse all published content
- **New Post** - Create new blog post
- **Editorial Calendar** - Plan content schedule
- **SUCCESS+** - Manage premium content
- **SEO Manager** - Optimize site for search
- **Site Analytics** - View traffic and engagement
- **Site Monitor** - Check system health

---

## SUCCESS+ Management

SUCCESS+ is the premium membership platform. Here's how to manage it:

### Courses

**Location:** `Admin → SUCCESS+ → SUCCESS+ Dashboard → Courses Manager`

#### Creating a Course

1. Click "Create New Course"
2. Fill in required fields:
   - **Title:** Course name (e.g., "Leadership Fundamentals")
   - **Slug:** URL-friendly version (e.g., "leadership-fundamentals")
   - **Description:** What students will learn
   - **Instructor Name:** Course teacher
   - **Duration:** Total course time in minutes
   - **Level:** BEGINNER, INTERMEDIATE, or ADVANCED
3. Optional fields:
   - Instructor bio and photo
   - Thumbnail image
   - Premium status (SUCCESS+ only or free)
4. Click "Save Draft" or "Publish"

#### Managing Course Content

1. Click course title to edit
2. Add modules (sections):
   - Click "Add Module"
   - Enter module title and description
   - Set module order
3. Add lessons to modules:
   - Click module
   - Click "Add Lesson"
   - Enter lesson details
   - Upload video or add content
   - Mark if lesson is free preview

**Best Practices:**
- Structure courses in logical modules (5-10 lessons per module)
- Offer 1-2 free preview lessons
- Keep videos under 15 minutes
- Add downloadable resources to lessons

### Events

**Location:** `Admin → SUCCESS+ → Events Manager`

#### Creating an Event

1. Click "Create New Event"
2. Fill in details:
   - **Title:** Event name
   - **Type:** WEBINAR, WORKSHOP, QA_SESSION, NETWORKING, MASTERCLASS, or CONFERENCE
   - **Start Date/Time:** When event begins
   - **End Date/Time:** When event ends (optional)
   - **Timezone:** Default is America/New_York
   - **Host:** Speaker/facilitator name
   - **Max Attendees:** Capacity limit (leave blank for unlimited)
3. Add description, thumbnail, and location (for in-person events)
4. Publish or save as draft

#### Managing Registrations

1. Click event title
2. View "Registrations" tab
3. See list of registered members
4. Export attendee list (CSV)
5. Mark attendees as "Attended" after event

**Event Calendar View:**
- Click "Calendar View" to see events by month
- Filter by event type
- Filter by upcoming/past

**Tip:** Send reminder emails 24 hours before event starts

### Community Forum

**Location:** `Admin → SUCCESS+ → Community Manager`

#### Setting Up Categories

Before users can post, create forum categories:

1. Navigate to Community Manager
2. Click "Categories"
3. Click "New Category"
4. Enter:
   - Name (e.g., "General Discussion")
   - Slug (e.g., "general")
   - Description
   - Icon emoji (e.g., 💬)
   - Color hex code (e.g., #667eea)
   - Display order
5. Click "Create"

**Recommended Categories:**
- General Discussion
- SUCCESS+ Member Lounge
- Course Q&A
- Events & Networking
- Feature Requests

#### Moderating Topics

1. View all topics in "Topics" tab
2. Actions available:
   - **Pin:** Keep topic at top of list
   - **Lock:** Prevent new replies
   - **Close:** Mark as resolved/closed
   - **Delete:** Remove topic (use sparingly)

3. Responding to topics:
   - Click topic title
   - Read discussion
   - Add reply as staff member
   - Mark best answer as "Solution"

**Moderation Best Practices:**
- Respond to new topics within 24 hours
- Pin important announcements
- Close topics when question is answered
- Lock topics that violate community guidelines

### Resources Library

**Location:** `Admin → SUCCESS+ → Resource Library`

#### Uploading Resources

1. Click "Upload File"
2. Select file (PDF, DOCX, XLSX, etc.)
3. Fill in details:
   - Title
   - Description
   - Category (TEMPLATES, GUIDES, WORKSHEETS, EBOOKS, TOOLS, CHECKLISTS)
   - Thumbnail (optional)
4. Click "Upload"

**Or add external links:**

1. Click "Add Link"
2. Enter title, description, URL
3. Select category
4. Click "Save"

#### Organizing Resources

- Use categories to organize (e.g., all templates in TEMPLATES category)
- Add descriptive titles
- Include preview images when possible
- Mark inactive resources to hide from members

**Supported File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)
- Images (.jpg, .png)
- Archives (.zip)

### Shop & Products

**Location:** `Admin → SUCCESS+ → Shop Manager`

#### Adding Products

1. Click "Add Product"
2. Fill in required fields:
   - Product name
   - Slug (URL-friendly)
   - Price
   - Category (BOOKS, COURSES, MERCHANDISE, MAGAZINES, BUNDLES, MEMBERSHIPS)
3. Optional fields:
   - Sale price
   - SKU
   - Images
   - Inventory count
   - Stripe product ID (for payment processing)
4. Set status (ACTIVE, DRAFT, OUT_OF_STOCK, ARCHIVED)
5. Mark as featured to display on homepage

**Managing Inventory:**
- Update stock levels in product edit page
- Set status to OUT_OF_STOCK when depleted
- System prevents overselling

**Stripe Integration:**
- Connect products to Stripe for payment processing
- Add Stripe Product ID and Price ID
- Test checkout flow before going live

---

## Editorial Features

**Location:** `Admin → SUCCESS.COM`

### Content Viewer

View all published content:
- Filter by type (posts, pages, videos, podcasts)
- Search by title or content
- Sort by date, views, or author
- Quick actions: Edit, View, Archive

### Creating Blog Posts

1. Navigate to `Editorial Dashboard` → `New Post`
2. Enter title (auto-generates slug)
3. Write content using visual editor
4. Add featured image
5. Select categories and tags
6. Set excerpt (auto-generated if blank)
7. Configure SEO settings:
   - Meta title
   - Meta description
   - Keywords
8. Choose status: DRAFT, PUBLISHED, or ARCHIVED
9. Click "Publish" or "Save Draft"

**Editor Features:**
- Rich text formatting
- Image upload
- Video embed
- Code blocks
- Headings (H2, H3)
- Lists and quotes
- Links and buttons

### Categories & Tags

**Categories:** Primary content classification
- Business & Branding
- AI & Technology
- Entrepreneurship
- Culture & Workplace
- Health & Wellness

**Tags:** Specific topics for filtering
- Add multiple tags per post
- Create new tags as needed
- Tag limit: 5-10 per post

### Media Library

**Location:** `Editorial Dashboard → Media Library`

Upload and manage media files:

1. Click "Upload Files"
2. Drag and drop or select files
3. Supported: JPG, PNG, GIF, MP4, MP3, PDF
4. Files are automatically optimized
5. Use search to find existing media

**Best Practices:**
- Use descriptive file names (e.g., `leadership-summit-2025.jpg`)
- Optimize images before upload (max 2MB per image)
- Add alt text for SEO and accessibility
- Organize with tags

### SEO Manager

**Location:** `Editorial Dashboard → SEO`

Optimize content for search engines:

1. View SEO scores for all pages
2. See recommendations for improvement
3. Fix missing meta descriptions
4. Update titles for better click-through
5. Add focus keywords
6. Monitor internal linking

**SEO Checklist:**
- [ ] Title under 60 characters
- [ ] Meta description 150-160 characters
- [ ] Focus keyword in title and first paragraph
- [ ] Alt text on all images
- [ ] At least 300 words of content
- [ ] Internal links to related articles

---

## Customer Service

**Location:** `Admin → SALES & CUSTOMER SERVICE`

### Managing Subscriptions

View all member subscriptions:

1. Navigate to `Subscriptions`
2. See list of all active/inactive subscriptions
3. Filter by status, tier, or date
4. Click subscription to view details
5. Actions available:
   - Update billing info
   - Change tier
   - Cancel subscription
   - Issue refund

### Processing Refunds

1. Navigate to `Refunds`
2. View pending refund requests
3. Click request to review
4. Check reason and order details
5. Approve or deny refund
6. Add internal notes

**Refund Guidelines:**
- 30-day money-back guarantee
- Partial refunds for partial months
- Document reason for tracking

### Handling Disputes

1. Navigate to `Disputes`
2. View open disputes/chargebacks
3. Click to see details
4. Upload evidence (receipts, emails, etc.)
5. Submit response to payment processor
6. Track status until resolution

**Dispute Types:**
- REFUND - Customer requested refund
- CHARGEBACK - Bank dispute
- DISPUTE - Customer questions charge
- CANCELLATION - Service cancellation

### Member Management

1. Navigate to `Members`
2. Search or filter members
3. View member profile:
   - Subscription history
   - Order history
   - Support tickets
   - Engagement metrics
4. Add internal notes
5. Update tier or status

**Member Tiers:**
- Free - Basic access
- Customer - Purchased product
- SUCCESSPlus - Premium subscription
- VIP - High-value customer
- Enterprise - Corporate account

---

## Marketing & CRM

**Location:** `Admin → CRM & EMAIL`

### Managing Contacts

1. Navigate to `Contacts`
2. View all contacts in database
3. Filter by status, tags, or source
4. Import contacts from CSV
5. Export contacts for campaigns

**Contact Fields:**
- Name, email, phone
- Company
- Tags (for segmentation)
- Lead score
- Source (how they joined)
- Custom fields

### Creating Email Campaigns

1. Navigate to `Campaigns` → `New Campaign`
2. Enter campaign name
3. Select email template or create new
4. Choose recipients:
   - All contacts
   - Specific list
   - By tags
   - Dynamic segment
5. Set subject line and preview text
6. Schedule or send immediately
7. Track opens, clicks, and conversions

**Campaign Types:**
- Newsletter
- Product announcement
- Event invitation
- Course promotion
- Member engagement

### Email Templates

1. Navigate to `Templates`
2. Click "New Template"
3. Use email builder:
   - Drag-and-drop blocks
   - Add images, text, buttons
   - Use merge tags ({{firstName}}, {{email}})
   - Preview desktop and mobile
4. Save template
5. Reuse in campaigns

**Template Best Practices:**
- Keep design simple
- Mobile-first approach
- Clear call-to-action
- Include unsubscribe link

---

## User Roles & Permissions

### Role Definitions

**SUPER_ADMIN**
- Full access to all features
- Can create/delete admin users
- Can modify system settings
- Can access all departments

**ADMIN**
- Access to most features
- Can manage content and users
- Cannot modify system settings
- Department access based on assignment

**EDITOR**
- Can create and edit content
- Can publish posts
- Limited access to settings
- Primarily editorial department

**AUTHOR**
- Can create draft posts
- Cannot publish
- Cannot edit others' content
- Limited to editorial

**PENDING**
- New accounts awaiting approval
- No access until upgraded

### Department Access

Users can be assigned to departments:

- **SUPER_ADMIN** - System administration
- **CUSTOMER_SERVICE** - Orders, refunds, support
- **EDITORIAL** - Content creation and publishing
- **SUCCESS_PLUS** - Premium content management
- **DEV** - Technical and system management
- **MARKETING** - CRM, campaigns, analytics
- **COACHING** - Coaching programs (if applicable)

**How It Works:**
- Each user has a primary department
- Department determines which admin sections they can access
- SUPER_ADMIN and ADMIN can access all departments
- Lower roles only access their assigned department

---

## Tips & Best Practices

### Content Creation
- Write headlines that capture attention
- Use high-quality images (1200x630px for featured images)
- Break content into sections with H2/H3 headings
- Add internal links to related articles
- Include call-to-action at end of posts
- Proofread before publishing

### Course Development
- Start with course outline before creating
- Record in quiet environment with good lighting
- Keep videos concise (10-15 minutes max)
- Provide downloadable worksheets
- Add quizzes to reinforce learning
- Collect feedback from early students

### Community Management
- Respond to forum posts within 24 hours
- Encourage member-to-member interaction
- Recognize active contributors
- Create monthly discussion topics
- Address violations of community guidelines promptly

### Customer Support
- Respond to tickets within 4 business hours
- Use templates for common questions
- Escalate complex issues to manager
- Document all interactions
- Follow up after resolution

### Email Marketing
- A/B test subject lines
- Send on Tuesdays or Thursdays (best open rates)
- Segment your audience for targeted messaging
- Track metrics: open rate, click rate, conversions
- Clean email list quarterly (remove inactive)

### Data Management
- Back up important data regularly
- Don't delete unless absolutely necessary (archive instead)
- Use search instead of scrolling
- Tag and categorize for easy retrieval
- Export reports monthly

---

## Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save draft
- `Cmd/Ctrl + Enter` - Publish
- `Cmd/Ctrl + K` - Insert link
- `Cmd/Ctrl + B` - Bold text
- `Cmd/Ctrl + I` - Italic text

---

## Getting Help

### Support Resources

1. **API Documentation:** `API_DOCUMENTATION.md` - Technical reference
2. **Testing Guide:** `TESTING_GUIDE.md` - How to test features
3. **Deployment Checklist:** `DEPLOYMENT_CHECKLIST_UPDATED.md`
4. **Environment Variables:** `ENV_VARIABLES.md` - Configuration guide

### Reporting Issues

When reporting a bug:

1. Describe what you were trying to do
2. List steps to reproduce
3. Include screenshots
4. Note your role and department
5. Provide browser and OS details

### Feature Requests

Submit feature requests via:
- Community forum (Feature Requests category)
- Direct email to product team
- Monthly feedback survey

---

## Frequently Asked Questions

**Q: Can I have multiple roles?**
A: No, each user has one role. Contact your administrator to change roles.

**Q: How do I restore deleted content?**
A: Deleted items are moved to Archive. Go to Content Viewer → Archived to restore.

**Q: Can members see draft courses?**
A: No, only published courses are visible to members. Use draft status to work on courses before launch.

**Q: What happens if an event is over capacity?**
A: Additional registrations are placed on waitlist automatically.

**Q: How do I import existing courses?**
A: Use the Import feature under SUCCESS+ or contact support for bulk import.

**Q: Can I schedule posts for future publication?**
A: Yes, set publish date in post editor. Post will auto-publish at specified time.

---

**Last Updated:** January 4, 2026

For additional support, contact the admin team or reference the technical documentation.
