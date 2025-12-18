# Staff Testing Checklist

**SUCCESS Magazine Admin - Staff Testing Guide**

This checklist ensures all critical features are tested by staff before production launch.

---

## Testing Period

- **Duration:** 3-5 days
- **Testers:** 5 staff members (Admin, Editor, 2 Authors, Contributor)
- **Daily Standup:** 10am in #admin-feedback Slack channel
- **Feedback Deadline:** [Insert Date]

---

## Your Test Account

**Login URL:** https://staging.success.com/admin

**Your Credentials:**
- Email: `[will be provided]`
- Password: `Success2025!`
- Role: `[Your Role]`

**⚠️ Important:**
- Change your password after first login
- Use real workflows - create content as you normally would
- Report ALL issues, even minor ones
- This is test data - experiment freely!

---

## Day 1: Login & Navigation

### ✅ Login & Authentication

- [ ] Login with provided credentials
- [ ] Dashboard loads successfully
- [ ] Can navigate to different sections (Posts, Media, etc.)
- [ ] Logout works
- [ ] Login again successfully
- [ ] "Remember me" works (if applicable)

**Issues Found:**
```
[Describe any issues]
```

### ✅ Dashboard Overview

- [ ] Dashboard shows relevant stats
- [ ] Recent activity visible
- [ ] Quick actions accessible
- [ ] Navigation menu works
- [ ] Can access all sections based on your role

**Issues Found:**
```
[Describe any issues]
```

---

## Day 2: Post Management Basics

### ✅ View Posts List

- [ ] Navigate to Posts list
- [ ] All posts load correctly
- [ ] Post titles visible
- [ ] Authors shown correctly
- [ ] Categories displayed
- [ ] Dates formatted properly
- [ ] Status badges visible (Published, Draft, etc.)
- [ ] Featured images show as thumbnails

**Issues Found:**
```
[Describe any issues]
```

### ✅ Create New Post

- [ ] Click "Add New Post" button
- [ ] Editor loads successfully
- [ ] Can enter post title
- [ ] Can type in content editor
- [ ] Toolbar buttons work (Bold, Italic, etc.)
- [ ] Can add headings (H2, H3)
- [ ] Can create bullet lists
- [ ] Can create numbered lists
- [ ] Can add blockquotes

**Issues Found:**
```
[Describe any issues]
```

### ✅ Save Draft

- [ ] Click "Save Draft" button
- [ ] Post saves successfully
- [ ] Success message appears
- [ ] Can find draft in posts list
- [ ] Draft shows correct status

**Issues Found:**
```
[Describe any issues]
```

---

## Day 3: Media & Images

### ✅ Media Library Picker

- [ ] Click "🖼️ Library" button in editor
- [ ] Media library modal opens
- [ ] Existing images display in grid
- [ ] Can scroll through images
- [ ] Click to select image
- [ ] Image details show in sidebar (filename, size, etc.)
- [ ] Click "Insert into Post"
- [ ] Image inserts at cursor position
- [ ] Image displays correctly in editor

**Issues Found:**
```
[Describe any issues]
```

### ✅ Upload Images via Upload Button

- [ ] Click "📤 Upload" button in toolbar
- [ ] File picker opens
- [ ] Select one image from computer
- [ ] Upload progress shows
- [ ] Image uploads successfully
- [ ] Image auto-inserts into editor
- [ ] Select multiple images (2-3)
- [ ] All images upload
- [ ] All images insert correctly

**Issues Found:**
```
[Describe any issues]
```

### ✅ Drag-and-Drop Upload

- [ ] Drag image from desktop
- [ ] Drop onto editor area
- [ ] Upload progress shows
- [ ] Image uploads successfully
- [ ] Image inserts at cursor/drop position
- [ ] Try dragging multiple images
- [ ] All images upload and insert

**Issues Found:**
```
[Describe any issues]
```

### ✅ Featured Image

- [ ] Go to sidebar → Media tab
- [ ] Click "Set Featured Image"
- [ ] Media library opens
- [ ] Select an image
- [ ] Featured image sets correctly
- [ ] Preview shows in sidebar
- [ ] Can replace featured image
- [ ] Can remove featured image

**Issues Found:**
```
[Describe any issues]
```

---

## Day 4: Advanced Post Features

### ✅ Post Metadata

- [ ] Add excerpt in sidebar
- [ ] Select categories (Settings tab)
- [ ] Multiple categories can be selected
- [ ] Add SEO title (SEO tab)
- [ ] Add meta description (SEO tab)
- [ ] Character count shows for SEO fields
- [ ] All metadata saves correctly

**Issues Found:**
```
[Describe any issues]
```

### ✅ Publish Post

- [ ] Complete a post with all fields
- [ ] Click "Publish" button
- [ ] Confirmation appears (if applicable)
- [ ] Post publishes successfully
- [ ] Post appears in "Published" list
- [ ] Post status shows "Published"
- [ ] View post on frontend (click "View" link)
- [ ] Post displays correctly on site

**Issues Found:**
```
[Describe any issues]
```

### ✅ Edit Existing Post

- [ ] Go to posts list
- [ ] Click on a post title
- [ ] Post loads in editor
- [ ] Make some changes
- [ ] Save changes
- [ ] Changes save successfully
- [ ] Go back to posts list
- [ ] Modified date updated

**Issues Found:**
```
[Describe any issues]
```

---

## Day 5: Bulk Actions & Search

### ✅ Search Posts

- [ ] Go to posts list
- [ ] Type in search box
- [ ] Results filter as you type (real-time)
- [ ] Search finds posts by title
- [ ] Try searching by slug/URL
- [ ] Clear search box
- [ ] All posts return

**Issues Found:**
```
[Describe any issues]
```

### ✅ Filter Posts

**Status Filter (Tabs):**
- [ ] Click "Published" tab
- [ ] Only published posts show
- [ ] Click "Draft" tab
- [ ] Only drafts show
- [ ] Result count updates correctly

**Author Filter:**
- [ ] Select your name from Author dropdown
- [ ] Only your posts show
- [ ] Select "All Authors"
- [ ] All posts return

**Category Filter:**
- [ ] Select a category from dropdown
- [ ] Only posts in that category show
- [ ] Try different categories

**Date Filter:**
- [ ] Select "Last 7 Days"
- [ ] Only recent posts show
- [ ] Try "Last 30 Days"
- [ ] Try "This Month"

**Combined Filters:**
- [ ] Use search + category filter together
- [ ] Results match both criteria
- [ ] Click "Clear Filters"
- [ ] All posts return

**Issues Found:**
```
[Describe any issues]
```

### ✅ Bulk Actions

**Select Posts:**
- [ ] Check box next to 2-3 posts
- [ ] Selection count shows (e.g., "3 items selected")
- [ ] Checked posts highlight
- [ ] Click "Select All" checkbox
- [ ] All visible posts select
- [ ] Click again to deselect all

**Bulk Publish:**
- [ ] Select 2-3 draft posts
- [ ] Choose "Publish" from bulk dropdown
- [ ] Click "Apply"
- [ ] Confirmation dialog appears
- [ ] Confirm action
- [ ] Posts change to Published status
- [ ] Success message appears

**Bulk Draft:**
- [ ] Select 2 published posts
- [ ] Choose "Move to Draft"
- [ ] Click "Apply"
- [ ] Confirm
- [ ] Posts move to Draft status

**Bulk Trash:**
- [ ] Select 1-2 posts
- [ ] Choose "Move to Trash"
- [ ] Click "Apply"
- [ ] Warning dialog appears
- [ ] Confirm
- [ ] Posts move to trash (if trash exists) or delete

**Issues Found:**
```
[Describe any issues]
```

### ✅ Quick Edit

- [ ] Hover over post in list
- [ ] Click "Quick Edit" link
- [ ] Inline editor expands
- [ ] Can change title
- [ ] Can change status
- [ ] Can change categories
- [ ] Can change publish date
- [ ] Click "Update"
- [ ] Changes save
- [ ] Editor closes
- [ ] Changes visible in list

**Issues Found:**
```
[Describe any issues]
```

---

## Role-Specific Testing

### For ADMIN Users Only

- [ ] Can access all posts (any author)
- [ ] Can edit any post
- [ ] Can delete any post
- [ ] Can access user management (if available)
- [ ] Can access settings (if available)
- [ ] Can see analytics/reports (if available)

### For EDITOR Users Only

- [ ] Can edit all posts
- [ ] Can publish all posts
- [ ] Cannot access user management
- [ ] Cannot access site settings

### For AUTHOR Users Only

- [ ] Can only see own posts
- [ ] Can edit own posts
- [ ] Can publish own posts
- [ ] Cannot edit others' posts
- [ ] Cannot delete others' posts

---

## Performance Testing

### ✅ Speed & Responsiveness

- [ ] Pages load in < 3 seconds
- [ ] Editor feels responsive (no lag when typing)
- [ ] Media library loads quickly
- [ ] Image upload is reasonably fast
- [ ] Search/filter results appear instantly
- [ ] Bulk actions complete quickly

**Issues Found:**
```
[Describe performance issues]
```

### ✅ Mobile/Tablet Testing (Optional)

- [ ] Login works on mobile
- [ ] Dashboard navigable on mobile
- [ ] Can create post on tablet
- [ ] Media library usable on mobile
- [ ] Bulk actions work on tablet

**Issues Found:**
```
[Describe mobile issues]
```

---

## Error Handling

### ✅ Test Error Scenarios

- [ ] Try to save empty post (no title)
- [ ] Appropriate error message shows
- [ ] Try to upload very large image (>10MB)
- [ ] Upload rejected with clear message
- [ ] Try to upload non-image file
- [ ] Rejected with clear message
- [ ] Lose internet connection while editing
- [ ] Graceful error handling

**Issues Found:**
```
[Describe error handling issues]
```

---

## User Experience Feedback

### ✅ Overall Usability

**What works well:**
```
[List what you liked]
```

**What's confusing:**
```
[List what was unclear or hard to use]
```

**What's missing:**
```
[Features you expected but didn't find]
```

**Suggestions:**
```
[Ideas for improvement]
```

---

## Bug Report Template

For each bug found, provide:

### Bug #1

**Severity:** 🔴 Critical / 🟡 Major / 🟢 Minor

**Title:** [Short description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshot:**
[Attach if possible]

**Browser/Device:**
[e.g., Chrome 120 on Windows 11]

---

## Daily Check-In Questions

### End of Day 1
- What features did you test?
- Any blockers or confusion?
- How would you rate ease of use (1-10)?

### End of Day 2
- Were you able to create posts easily?
- Any issues with the editor?
- How intuitive was the interface?

### End of Day 3
- Did media upload work smoothly?
- Any issues with images in posts?
- Drag-and-drop work as expected?

### End of Day 4
- Are all post features working?
- Missing any features you expected?
- How's the overall workflow?

### End of Day 5
- Did bulk actions work correctly?
- Search/filter as expected?
- Ready to use this for real work?
- Final satisfaction rating (1-10)?

---

## Final Sign-Off

**Tester Name:** ___________________________

**Role:** ___________________________

**Testing Completed:** ___/___/2025

**Overall Rating:** ___/10

**Ready for Production?** ☐ Yes  ☐ No  ☐ With Fixes

**Critical Issues Found:** ___ (must fix before launch)

**Nice-to-Have Improvements:** ___ (can address later)

**Signature:** ___________________________

---

## Submit Your Feedback

**Methods to submit:**

1. **Slack:** Post in #admin-feedback channel
2. **Google Form:** [Insert link]
3. **Email:** [Insert email]
4. **GitHub Issues:** [Insert repo link] (for bugs)

**What to include:**
- Completed checklist (this document)
- Screenshots of bugs
- Screen recording of issues (optional)
- Feature suggestions
- Overall satisfaction rating

---

## Thank You!

Your feedback is critical to making this admin system great. Thank you for taking the time to thoroughly test and provide detailed feedback!

**Questions?** Ask in #admin-feedback or email [project manager email]
