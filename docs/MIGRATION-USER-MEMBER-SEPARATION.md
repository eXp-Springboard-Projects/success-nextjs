# User/Member Separation Migration Guide

## Overview

This migration separates **Users** (platform access) from **Members** (customers/commerce) to fix the critical data architecture issue where admin users and staff were appearing in the "Customers" section.

### Before Migration
- **users** table contained both platform users (admin/staff) AND customers
- Everyone with a users record appeared in "Members/Customers" section
- No clear distinction between internal staff and actual paying customers

### After Migration
- **users** table = Platform access only (Admin, Super Admin, Editor, Staff)
- **members** table = Customers who have purchased/subscribed
- **Dual-role support**: Rachel (Super Admin) who buys SUCCESS+ will appear in BOTH sections with combined badges

---

## Architecture

### Users Table (Platform Access)
```typescript
model users {
  id          String
  email       String   @unique
  name        String
  password    String
  role        UserRole // SUPER_ADMIN, ADMIN, EDITOR, STAFF
  avatar      String?

  // Link to Member if they're ALSO a customer
  memberId    String?  @unique
  member      members? @relation("UserMemberLink")
}
```

**Shows in:** `/admin/users` page ONLY

**Purpose:** Platform access control (CMS, admin panel, content editing)

**Examples:**
- Rachel (Super Admin, no purchases) → Users only
- Eddi (Admin, no purchases) → Users only
- Tyler (Editor, no purchases) → Users only

---

### Members Table (Customers/Commerce)
```typescript
model members {
  id                 String
  firstName          String
  lastName           String
  email              String         @unique
  membershipTier     MembershipTier // Free, Customer, SUCCESSPlus, VIP, Enterprise
  membershipStatus   MemberStatus   // Active, Inactive, Suspended, Cancelled
  totalSpent         Decimal
  lifetimeValue      Decimal

  // Link to User if they ALSO have platform access
  platformUser       users?         @relation("UserMemberLink")

  // Commerce relations
  transactions       transactions[]
  subscriptions      subscriptions[]
  orders             orders[]
}
```

**Shows in:** `/admin/sales-cs/members` (Customers section) OR `/admin/members`

**Purpose:** Customer management, sales, subscriptions, orders

**Filter:** ONLY shows members where:
- `totalSpent > 0` OR
- `membershipTier != Free` OR
- Has active/past subscriptions

**Examples:**
- Customer who bought SUCCESS+ → Members only
- Rachel (Super Admin) who bought SUCCESS+ → BOTH Users AND Members with combined badges

---

## Membership Tiers (Auto-assigned)

| Tier | Trigger | Display |
|------|---------|---------|
| `Free` | No purchases, no subscription | Hidden in Customers view |
| `Customer` | Made a one-time purchase | Shows in Customers |
| `SUCCESSPlus` | Active SUCCESS+ subscription | Shows in Customers |
| `VIP` | VIP tier purchase | Shows in Customers |
| `Enterprise` | Enterprise tier | Shows in Customers |

---

## Combined Role Badges

### Users Admin Page
Shows platform role **first**, then membership tier (if they're also a customer):

```
Rachel Nead
├── SUPER ADMIN (red badge)
└── SUCCESS+ (purple badge)

Eddi Brown
└── ADMIN (orange badge)

Tyler Jones
└── EDITOR (blue badge)
```

### Members/Customers Page
Shows membership tier **first**, then platform role (if they also have admin access):

```
John Doe
└── SUCCESS+ (purple badge)

Rachel Nead
├── SUCCESS+ (purple badge)
└── SUPER ADMIN (red badge)

Jane Smith
└── Customer (cyan badge)
```

---

## Migration Steps

### Step 1: Backup Database
```bash
# CRITICAL: Backup your database before running migration
# Vercel Postgres: Use Vercel dashboard to create snapshot
# Local Postgres:
pg_dump -U postgres -d verceldb > backup_before_user_member_separation.sql
```

### Step 2: Run Prisma Migration
```bash
# Generate migration from schema changes
npx prisma migrate dev --name separate_users_and_members

# OR if using Vercel Postgres with DATABASE_URL
DATABASE_URL="postgres://..." npx prisma migrate dev --name separate_users_and_members
```

This creates:
- `members` table
- `transactions` table
- `subscribers` table
- `refund_disputes` table
- Updates `subscriptions` table to link to `members` instead of `users`
- Updates `orders` table to link to `members` instead of `users`
- Adds `memberId` field to `users` table

### Step 3: Run Data Migration Script
```bash
# Execute the migration script to separate existing data
npx tsx scripts/migrate-users-to-members.ts

# OR with DATABASE_URL
DATABASE_URL="postgres://..." npx tsx scripts/migrate-users-to-members.ts
```

**What this script does:**
1. Finds all existing users
2. For each user:
   - **Has subscription or Stripe customer ID?** → Create `members` record
   - **Platform role (admin/editor)?** → Keep as `users` record
   - **Both?** → Create `members` record AND link `users.memberId`
3. Migrates all `subscriptions` to point to new `members`
4. Migrates all `orders` to point to new `members`

**Expected output:**
```
🚀 Starting User/Member migration...

📊 Found 15 total users

👤 Platform user only: rachel@success.com (SUPER_ADMIN)
👤 Platform user only: eddi@success.com (ADMIN)
👤 Platform user only: tyler@success.com (EDITOR)

💰 Creating member for: customer1@example.com
  ✅ Customer only: customer1@example.com → SUCCESSPlus

💰 Creating member for: customer2@example.com
  ✅ Dual role: customer2@example.com is both ADMIN AND Customer

✨ Migration complete!

📊 Summary:
   - Platform-only users: 12
   - Members created: 3
   - Dual-role (admin + customer): 1
   - Orders migrated: 5
```

### Step 4: Verify Migration
```bash
# Check database
npx prisma studio

# Verify:
1. Users table only has platform users (admin, editors, staff)
2. Members table has customers with purchases/subscriptions
3. Subscriptions.memberId points to members (not users)
4. Orders.memberId points to members (not users)
5. Dual-role users have memberId set
```

### Step 5: Test in Admin Panel
1. Go to `/admin/users`
   - Should show ONLY platform users (admin, editors, staff)
   - Dual-role users show combined badges (e.g., "SUPER ADMIN • SUCCESS+")

2. Go to `/admin/members` or `/admin/sales-cs/members`
   - Should show ONLY customers who have purchased
   - Should NOT show admins who haven't purchased
   - Dual-role customers show combined badges (e.g., "SUCCESS+ • SUPER ADMIN")

---

## Webhook Behavior (NEW)

### Stripe Webhook (`/api/webhooks/stripe`)

**When subscription created:**
1. Check if `members` record exists by email or Stripe customer ID
2. **If NOT exists:**
   - Create NEW `members` record
   - Set `membershipTier = SUCCESSPlus`
   - Set `membershipStatus = Active`
3. **If exists:**
   - Update `membershipTier = SUCCESSPlus`
4. Create/update `subscriptions` record linked to `members.id`
5. Check if matching `users` record exists (same email)
   - If yes AND no `memberId` yet → Link `users.memberId` to new member
6. Create `transactions` record with payment details

**Result:** Webhook creates `members` record, NOT `users` record

---

## Key Business Rules

### ✅ DO
- Creating admin user → Creates `users` record ONLY (no member)
- Stripe purchase webhook → Creates `members` record ONLY (no user)
- Admin who purchases → Links existing `users` to new/existing `members`

### ❌ DON'T
- Don't show `membershipTier = Free` in Customers section (unless `totalSpent > 0`)
- Don't create `users` record from webhook payments
- Don't create `members` record when adding admin users

---

## API Endpoints Changed

### `/api/admin/members` (NEW)
- **GET**: Returns ONLY members with purchases/subscriptions
- **Filter**: Excludes `membershipTier = Free` unless `totalSpent > 0`
- **Includes**: `platformUser` relation (if they're also admin)

### `/api/admin/members/[id]` (UPDATED)
- Now queries `members` table instead of `users`
- Includes `transactions`, `orders`, `subscriptions`, `platformUser`

### `/api/users` (UPDATED)
- Now includes `member` relation
- Returns `membershipTier` if user is also a customer

---

## Rollback Plan

If migration fails:

1. **Restore database backup:**
   ```bash
   psql -U postgres -d verceldb < backup_before_user_member_separation.sql
   ```

2. **Revert Prisma schema:**
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   npx prisma migrate dev
   ```

3. **Revert code changes:**
   ```bash
   git checkout HEAD~1 pages/api/webhooks/stripe.js
   git checkout HEAD~1 pages/admin/members.tsx
   git checkout HEAD~1 pages/admin/users/index.tsx
   ```

---

## Testing Scenarios

### Scenario 1: Admin-Only User
**Given:** Rachel is Super Admin, no purchases
**Expected:**
- Shows in `/admin/users` with "SUPER ADMIN" badge
- Does NOT show in `/admin/members` (Customers)
- No `memberId` in users table

### Scenario 2: Customer-Only
**Given:** John Doe purchased SUCCESS+, no platform access
**Expected:**
- Does NOT show in `/admin/users`
- Shows in `/admin/members` with "SUCCESS+" badge
- Has `members` record, no `users` record

### Scenario 3: Dual-Role (Admin + Customer)
**Given:** Eddi is Admin AND purchased SUCCESS+
**Expected:**
- Shows in `/admin/users` with "ADMIN • SUCCESS+" badges
- Shows in `/admin/members` with "SUCCESS+ • ADMIN" badges
- Has both `users` and `members` records
- `users.memberId` links to `members.id`

### Scenario 4: Webhook Creates New Customer
**Given:** Stripe webhook for new customer@example.com
**Expected:**
- Creates `members` record
- Does NOT create `users` record
- Creates `subscriptions` record
- Creates `transactions` record
- Customer appears in `/admin/members`

---

## Success Criteria

✅ Admin users (no purchases) do NOT appear in Customers section
✅ Customers (no platform access) do NOT appear in Users section
✅ Dual-role users appear in BOTH with combined badges
✅ Stripe webhooks create Members, not Users
✅ All existing subscriptions migrated to members table
✅ All existing orders migrated to members table
✅ Customer Service team sees ONLY actual customers in Customers section

---

## Support

If you encounter issues:

1. Check migration script output for errors
2. Verify database state in Prisma Studio
3. Check webhook logs in Stripe dashboard
4. Review Vercel logs for API errors

**Contact:** Developer team for assistance

---

## Files Changed

### Prisma Schema
- `prisma/schema.prisma` - Added `members`, `transactions`, `subscribers`, `refund_disputes` models

### Migration Script
- `scripts/migrate-users-to-members.ts` - Data migration script

### API Routes
- `pages/api/webhooks/stripe.js` - Updated to create Members instead of Users
- `pages/api/admin/members/index.ts` - NEW endpoint for customer listing
- `pages/api/admin/members/[id].ts` - Updated to query Members table
- `pages/api/users/index.ts` - Updated to include member info

### Admin UI
- `components/admin/RoleBadges.tsx` - NEW combined badge component
- `components/admin/RoleBadges.module.css` - Badge styling
- `pages/admin/members.tsx` - Updated to show Members with filter
- `pages/admin/users/index.tsx` - Updated to show combined badges

---

**Last Updated:** 2025-01-29
**Version:** 1.0
**Status:** Ready for Production
