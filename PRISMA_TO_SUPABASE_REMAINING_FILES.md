# Prisma to Supabase Conversion - Remaining Files

## Summary
This document lists ALL files that still need to be converted from Prisma to Supabase. Due to the large volume (175+ files), this document provides a systematic approach to complete the conversion.

**Total Files Found:** 175+ files importing from '@prisma/client'
**Files Manually Converted:** 2 (stripe webhook, landing page)
**Remaining Files:** 173+

## Files Already Converted

1. ✅ `C:\Users\RachelNead\success-next\pages\api\webhooks\stripe.js` - COMPLETED
2. ✅ `C:\Users\RachelNead\success-next\pages\lp\[slug].tsx` - COMPLETED

## All Remaining Files to Convert

### API Routes - Stripe Integration (5 files)
1. `pages/api/stripe/webhooks.ts`
2. `pages/api/stripe/webhook.ts`
3. `pages/api/stripe/verify-session.ts`
4. `pages/api/stripe/create-portal-session.ts`
5. `pages/api/stripe/create-checkout-session.ts`

### API Routes - Watch History (3 files)
6. `pages/api/watch-history/index.ts`
7. `pages/api/watch-history/update.ts`
8. `pages/api/watch-history/[contentType]/[contentId].ts`

### API Routes - User (2 files)
9. `pages/api/user/trial-status.ts`
10. `pages/api/user/subscription.ts`

### API Routes - Account (2 files)
11. `pages/api/account/index.ts`
12. `pages/api/account/update.ts`

### API Routes - Dashboard (10 files)
13. `pages/api/dashboard/videos.ts`
14. `pages/api/dashboard/subscription-status.ts`
15. `pages/api/dashboard/settings.ts`
16. `pages/api/dashboard/resources.ts`
17. `pages/api/dashboard/premium-content.ts`
18. `pages/api/dashboard/podcasts.ts`
19. `pages/api/dashboard/magazines.ts`
20. `pages/api/dashboard/labs.ts`
21. `pages/api/dashboard/events.ts`
22. `pages/api/dashboard/courses.ts`

### API Routes - Analytics (4 files)
23. `pages/api/analytics.ts`
24. `pages/api/analytics/track.ts`
25. `pages/api/analytics/stats.ts`
26. `pages/api/analytics/dashboard.ts`

### API Routes - Admin Staff (7 files)
27. `pages/api/admin/staff/pending.ts`
28. `pages/api/admin/staff/create.ts`
29. `pages/api/admin/staff/[id]/send-email.ts`
30. `pages/api/admin/staff/[id]/reset-password.ts`

### API Routes - Admin Success Plus (4 files)
31. `pages/api/admin/success-plus/trials.ts`
32. `pages/api/admin/success-plus/dashboard-stats.ts`
33. `pages/api/admin/success-plus/content.ts`

### API Routes - Admin Departments (1 file)
34. `pages/api/admin/departments/assign.ts`

### API Routes - Admin Customer Service (5 files)
35. `pages/api/admin/customer-service/dashboard-stats.ts`
36. `pages/api/admin/customer-service/subscriptions/index.ts`
37. `pages/api/admin/customer-service/refunds/[id].ts`
38. `pages/api/admin/customer-service/refunds/index.ts`

### API Routes - Admin Refunds (1 file)
39. `pages/api/admin/refunds/index.ts`

### API Routes - Admin Activity (1 file)
40. `pages/api/admin/activity/index.ts`

### API Routes - Admin Announcements (3 files)
41. `pages/api/admin/announcements/active.ts`
42. `pages/api/admin/announcements/index.ts`
43. `pages/api/admin/announcements/[id].ts`

### API Routes - Admin Marketing (1 file)
44. `pages/api/admin/marketing/dashboard-stats.ts`

### API Routes - Admin Editorial (1 file)
45. `pages/api/admin/editorial/dashboard-stats.ts`

### API Routes - Admin Dev (1 file)
46. `pages/api/admin/dev/dashboard-stats.ts`

### API Routes - Admin CRM Contacts (7 files)
47. `pages/api/admin/crm/contacts/index.ts`
48. `pages/api/admin/crm/contacts/import.ts`
49. `pages/api/admin/crm/contacts/export.ts`
50. `pages/api/admin/crm/contacts/[id].ts`
51. `pages/api/admin/crm/contacts/[id]/tags.ts`
52. `pages/api/admin/crm/contacts/[id]/tags/[tagId].ts`
53. `pages/api/admin/crm/contacts/[id]/notes.ts`

### API Routes - Admin CRM Campaigns (8 files)
54. `pages/api/admin/crm/campaigns/index.ts`
55. `pages/api/admin/crm/campaigns/estimate-recipients.ts`
56. `pages/api/admin/crm/campaigns/[id].ts`
57. `pages/api/admin/crm/campaigns/[id]/send.ts`
58. `pages/api/admin/crm/campaigns/[id]/schedule.ts`
59. `pages/api/admin/crm/campaigns/[id]/report.ts`
60. `pages/api/admin/crm/campaigns/[id]/recipients.ts`
61. `pages/api/admin/crm/campaigns/[id]/pause.ts`

### API Routes - Admin CRM Templates (5 files)
62. `pages/api/admin/crm/templates/index.ts`
63. `pages/api/admin/crm/templates/[id].ts`
64. `pages/api/admin/crm/templates/[id]/test-send.ts`
65. `pages/api/admin/crm/templates/[id]/duplicate.ts`

### API Routes - Admin CRM Tasks (3 files)
66. `pages/api/admin/crm/tasks/index.ts`
67. `pages/api/admin/crm/tasks/[id].ts`
68. `pages/api/admin/crm/tasks/[id]/complete.ts`

### API Routes - Admin CRM Tickets (4 files)
69. `pages/api/admin/crm/tickets/index.ts`
70. `pages/api/admin/crm/tickets/[id].ts`
71. `pages/api/admin/crm/tickets/[id]/messages.ts`

### API Routes - Admin CRM Sequences (7 files)
72. `pages/api/admin/crm/sequences/index.ts`
73. `pages/api/admin/crm/sequences/[id].ts`
74. `pages/api/admin/crm/sequences/[id]/unenroll.ts`
75. `pages/api/admin/crm/sequences/[id]/enrollments.ts`
76. `pages/api/admin/crm/sequences/[id]/enroll.ts`
77. `pages/api/admin/crm/sequences/[id]/duplicate.ts`

### API Routes - Admin CRM Deals (6 files)
78. `pages/api/admin/crm/deals/stats.ts`
79. `pages/api/admin/crm/deals/index.ts`
80. `pages/api/admin/crm/deals/[id].ts`
81. `pages/api/admin/crm/deals/[id]/activities.ts`
82. `pages/api/admin/crm/deals/[id]/stage.ts`

### API Routes - Admin CRM Lists (7 files)
83. `pages/api/admin/crm/lists/preview.ts`
84. `pages/api/admin/crm/lists/index.ts`
85. `pages/api/admin/crm/lists/[id]/index.ts`
86. `pages/api/admin/crm/lists/[id]/members.ts`
87. `pages/api/admin/crm/lists/[id]/members/[contactId].ts`
88. `pages/api/admin/crm/lists/[id]/preview.ts`

### API Routes - Admin CRM Reports (3 files)
89. `pages/api/admin/crm/reports/deals.ts`
90. `pages/api/admin/crm/reports/email.ts`
91. `pages/api/admin/crm/reports/contacts.ts`

### API Routes - Admin CRM Promotions (2 files)
92. `pages/api/admin/crm/promotions/index.ts`
93. `pages/api/admin/crm/promotions/[id].ts`

### API Routes - Admin CRM Lead Scoring (2 files)
94. `pages/api/admin/crm/lead-scoring/rules/index.ts`
95. `pages/api/admin/crm/lead-scoring/rules/[id].ts`

### API Routes - Admin CRM Landing Pages (3 files)
96. `pages/api/admin/crm/landing-pages/index.ts`
97. `pages/api/admin/crm/landing-pages/[id].ts`
98. `pages/api/admin/crm/landing-pages/[id]/duplicate.ts`

### API Routes - Admin CRM Forms (4 files)
99. `pages/api/admin/crm/forms/index.ts`
100. `pages/api/admin/crm/forms/[id]/index.ts`
101. `pages/api/admin/crm/forms/[id]/submissions.ts`
102. `pages/api/admin/crm/forms/[id]/duplicate.ts`

### API Routes - Admin CRM Automations (5 files)
103. `pages/api/admin/crm/automations/index.ts`
104. `pages/api/admin/crm/automations/[id].ts`
105. `pages/api/admin/crm/automations/[id]/pause.ts`
106. `pages/api/admin/crm/automations/[id]/enrollments.ts`
107. `pages/api/admin/crm/automations/[id]/activate.ts`

### API Routes - Admin CRM Unsubscribes (2 files)
108. `pages/api/admin/crm/unsubscribes/index.ts`
109. `pages/api/admin/crm/unsubscribes/[id]/resubscribe.ts`

### API Routes - Admin CRM Analytics (1 file)
110. `pages/api/admin/crm/analytics/index.ts`

### API Routes - Admin CRM Dashboard (1 file)
111. `pages/api/admin/crm/dashboard-stats.ts`

### API Routes - CRM (Non-Admin) (7 files)
112. `pages/api/crm/contacts.ts`
113. `pages/api/crm/contacts/[id].ts`
114. `pages/api/crm/campaigns.ts`
115. `pages/api/crm/campaigns/[id].ts`
116. `pages/api/crm/templates.ts`
117. `pages/api/crm/templates/[id].ts`
118. `pages/api/crm/emails/send.ts`

### API Routes - Editorial Calendar (2 files)
119. `pages/api/editorial-calendar/index.ts`
120. `pages/api/editorial-calendar/[id].ts`

### API Routes - Claim Account (3 files)
121. `pages/api/claim-account/validate-token.ts`
122. `pages/api/claim-account/send-link.ts`
123. `pages/api/claim-account/complete.ts`

### API Routes - Paywall (3 files)
124. `pages/api/paywall/track.ts`
125. `pages/api/paywall/config.ts`
126. `pages/api/paywall/analytics.ts`

### API Routes - Projects (2 files)
127. `pages/api/projects/index.ts`
128. `pages/api/projects/[id].ts`

### API Routes - Media (3 files)
129. `pages/api/media/index.ts`
130. `pages/api/media/upload.ts`
131. `pages/api/media/[id].ts`

### API Routes - Misc (11 files)
132. `pages/api/settings.js`
133. `pages/api/signup/staff.ts`
134. `pages/api/sitemap.xml.ts`
135. `pages/api/seo/index.ts`
136. `pages/api/search.ts`
137. `pages/api/redirects/check.ts`
138. `pages/api/paykickstart/webhook.ts`
139. `pages/api/newsletter/subscribe.ts`
140. `pages/api/forms/[id]/submit.ts`
141. `pages/api/email/unsubscribe.ts`
142. `pages/api/contact/submit.ts`
143. `pages/api/cache/purge.ts`
144. `pages/api/bulk-actions/index.ts`
145. `pages/api/activity-logs/index.ts`

### Scripts (40+ files)
146. `scripts/test-media.ts`
147. `scripts/test-marketing-features.ts`
148. `scripts/test-login.ts`
149. `scripts/test-helpdesk.ts`
150. `scripts/test-customer-service-features.ts`
151. `scripts/test-crm-campaign.ts`
152. `scripts/test-all-features.ts`
153. `scripts/set-admin-role.ts`
154. `scripts/set-admin-password.ts`
155. `scripts/send-staff-invites.ts`
156. `scripts/seed-permissions.ts`
157. `scripts/seed-email-templates.ts`
158. `scripts/seed-automations.ts`
159. `scripts/seed-deal-stages.ts`
160. `scripts/seed-admin-users.ts`
161. `scripts/reset-admin-password.ts`
162. `scripts/import-images-bulk.ts`
163. `scripts/import-featured-images.ts`
164. `scripts/get-staff-list.ts`
165. `scripts/fix-test-content.ts`
166. `scripts/fix-success-plus-tiers.ts`
167. `scripts/fix-media-schema.ts`
168. `scripts/delete-test-pages.ts`
169. `scripts/create-super-admin.ts`
170. `scripts/create-success-staff.ts`
171. `scripts/create-staff-accounts.ts`
172. `scripts/check-user-login.ts`
173. `scripts/check-team-members.ts`
174. `scripts/check-team-count.ts`
175. `scripts/check-success-plus-members.ts`
176. `scripts/check-subscriptions.ts`
177. `scripts/check-role-distribution.ts`
178. `scripts/check-posts-pages.ts`
179. `scripts/check-posts-images.ts`
180. `scripts/check-migrated-pages.ts`
181. `scripts/check-deleted-posts.ts`
182. `scripts/check-campaigns.ts`
183. `scripts/audit-static-pages.ts`
184. `scripts/add-team-members-table.ts`
185. `scripts/add-social-media-tables.ts`
186. `scripts/add-placeholder-images.ts`

## Conversion Patterns

### 1. Import Replacement

**Before:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**After:**
```typescript
import { supabaseAdmin } from '../../lib/supabase';
const supabase = supabaseAdmin();
```

### 2. Type Import Replacement

**Before:**
```typescript
import { PrismaClient, Department, UserRole } from '@prisma/client';
```

**After:**
```typescript
import { supabaseAdmin } from '../../lib/supabase';
import { Department, UserRole } from '../../lib/types';
```

### 3. Common Query Conversions

#### findFirst / findUnique
**Before:**
```typescript
const user = await prisma.users.findFirst({
  where: { email: email },
});
```

**After:**
```typescript
const { data: users } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .limit(1);
const user = users?.[0];
```

#### findMany
**Before:**
```typescript
const posts = await prisma.posts.findMany({
  where: { status: 'PUBLISHED' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

**After:**
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'PUBLISHED')
  .order('created_at', { ascending: false })
  .limit(10);
```

#### create
**Before:**
```typescript
const newUser = await prisma.users.create({
  data: {
    name: 'John',
    email: 'john@example.com',
  },
});
```

**After:**
```typescript
const { data: newUser } = await supabase
  .from('users')
  .insert({
    name: 'John',
    email: 'john@example.com',
  })
  .select()
  .single();
```

#### update
**Before:**
```typescript
await prisma.users.update({
  where: { id: userId },
  data: { name: 'Jane' },
});
```

**After:**
```typescript
await supabase
  .from('users')
  .update({ name: 'Jane' })
  .eq('id', userId);
```

#### delete
**Before:**
```typescript
await prisma.posts.delete({
  where: { id: postId },
});
```

**After:**
```typescript
await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

#### upsert
**Before:**
```typescript
await prisma.subscriptions.upsert({
  where: { stripeSubscriptionId: subId },
  create: { ...createData },
  update: { ...updateData },
});
```

**After:**
```typescript
const { data: existing } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('stripe_subscription_id', subId)
  .single();

if (!existing) {
  await supabase.from('subscriptions').insert(createData);
} else {
  await supabase.from('subscriptions').update(updateData).eq('stripe_subscription_id', subId);
}
```

#### count
**Before:**
```typescript
const count = await prisma.posts.count({
  where: { status: 'PUBLISHED' },
});
```

**After:**
```typescript
const { count } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'PUBLISHED');
```

#### OR conditions
**Before:**
```typescript
const member = await prisma.members.findFirst({
  where: {
    OR: [
      { stripeCustomerId: customerId },
      { email: email },
    ],
  },
});
```

**After:**
```typescript
const { data: members } = await supabase
  .from('members')
  .select('*')
  .or(`stripe_customer_id.eq.${customerId},email.eq.${email}`)
  .limit(1);
const member = members?.[0];
```

#### increment
**Before:**
```typescript
await prisma.members.update({
  where: { id: memberId },
  data: {
    totalSpent: { increment: amount },
  },
});
```

**After:**
```typescript
// First fetch current value
const { data: member } = await supabase
  .from('members')
  .select('total_spent')
  .eq('id', memberId)
  .single();

await supabase
  .from('members')
  .update({ total_spent: (member.total_spent || 0) + amount })
  .eq('id', memberId);
```

### 4. Field Name Conversions (camelCase to snake_case)

**Common conversions:**
- `firstName` → `first_name`
- `lastName` → `last_name`
- `stripeCustomerId` → `stripe_customer_id`
- `stripeSubscriptionId` → `stripe_subscription_id`
- `currentPeriodStart` → `current_period_start`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `memberId` → `member_id`
- etc. (see full list in conversion script)

## Recommended Approach

Given the large number of files (175+), here are the recommended conversion strategies:

### Option 1: Automated Conversion (Recommended)
1. Run the automated conversion script: `scripts/convert-prisma-to-supabase.ts`
2. This will handle import replacements and basic conversions
3. Manually review and fix complex queries

### Option 2: Batch Manual Conversion
1. Convert files by category (e.g., all stripe files, then all CRM files)
2. Use find-and-replace for common patterns
3. Test each batch before moving to the next

### Option 3: Gradual Migration
1. Convert files as you work on features
2. Maintain both Prisma and Supabase temporarily
3. Slowly phase out Prisma completely

## Next Steps

1. **Review the 2 completed conversions** as examples
2. **Run the automated conversion script** to handle imports
3. **Manually fix complex queries** that the script cannot handle
4. **Test each converted endpoint** thoroughly
5. **Remove Prisma dependencies** from package.json when complete

## Important Notes

- Always test converted endpoints before deploying
- Watch for field name mismatches (camelCase vs snake_case)
- Complex transactions may need special handling
- Nested includes require joins in Supabase
- Some Prisma-specific features may not have direct Supabase equivalents

## Status Tracking

- [ ] API Routes - Stripe (5 files)
- [ ] API Routes - Watch History (3 files)
- [ ] API Routes - User (2 files)
- [ ] API Routes - Account (2 files)
- [ ] API Routes - Dashboard (10 files)
- [ ] API Routes - Analytics (4 files)
- [ ] API Routes - Admin Staff (7 files)
- [ ] API Routes - Admin Success Plus (4 files)
- [ ] API Routes - Admin Customer Service (5 files)
- [ ] API Routes - Admin CRM (70+ files)
- [ ] API Routes - Other Admin (10 files)
- [ ] API Routes - Misc (20 files)
- [ ] Scripts (40+ files)

---

**Generated:** 2025-12-23
**Last Updated:** 2025-12-23
