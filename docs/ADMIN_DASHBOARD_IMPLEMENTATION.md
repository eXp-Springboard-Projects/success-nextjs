# Role-Based Admin Dashboard System - Implementation Guide

## Overview
This document outlines the role-based admin dashboard system for SUCCESS.com with 7 departments: Super Admin, Customer Service, Editorial, SUCCESS+, Dev, Marketing, and Coaching.

## ✅ Phase 1: Foundation (COMPLETED)

### Database Schema
**File:** `prisma/schema.prisma`
**Migration Script:** `scripts/add-admin-dashboard-tables.ts`

Added tables:
- `staff_announcements` - Company-wide announcements from Super Admin
- `staff_activity_feed` - Cross-department activity log
- `department_access_log` - Audit trail of dashboard access
- Added `primaryDepartment` field to `users` table
- Extended existing `staff_departments` for many-to-many user-department relationships

### Authentication & Authorization
**Files Created:**
- `lib/departmentAuth.ts` - Department-level access control
  - `requireDepartmentAuth()` - SSR middleware for department pages
  - `hasDepartmentAccess()` - Check if user can access department
  - `getAccessibleDepartments()` - Get list of departments user can access
  - `getDepartmentPath()` / `getDepartmentName()` - Utility functions
  - `logDepartmentAccess()` - Audit logging

- `lib/activityLogger.ts` - Activity feed logging
  - `logActivity()` - Log actions to activity feed
  - `getRecentActivity()` - Fetch recent activity
  - `ActivityActions` - Predefined action constants

### Shared UI Components
**File:** `components/admin/shared/DepartmentLayout.tsx`
- Full dashboard layout with:
  - Collapsible sidebar
  - Department badge/indicator
  - Shared features section (Kanban, Activity Feed, Notifications, Announcements)
  - Department-specific navigation
  - Department switcher (for Super Admin/Admin roles)
  - User profile with avatar and role
  - Sign out button
  - Responsive design

**File:** `components/admin/shared/DepartmentLayout.module.css`
- Complete styling for the department layout

## 🚀 Phase 2: Implementation Steps

### Step 1: Run Database Migration
```bash
# Generate Prisma client
DATABASE_URL="your_db_url" npx prisma generate

# Run migration
DATABASE_URL="your_db_url" npx tsx scripts/add-admin-dashboard-tables.ts

# Push schema to database
DATABASE_URL="your_db_url" npx prisma db push
```

### Step 2: Update NextAuth Configuration
**File to modify:** `pages/api/auth/[...nextauth].ts`

Add `primaryDepartment` to the session:
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role;
      token.primaryDepartment = user.primaryDepartment; // Add this
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.role = token.role;
      session.user.primaryDepartment = token.primaryDepartment; // Add this
    }
    return session;
  },
}
```

### Step 3: Create Department Dashboards

Each department needs:
1. Home page: `/pages/admin/[department]/index.tsx`
2. Department-specific pages (see navigation in DepartmentLayout.tsx)
3. CSS module: `/pages/admin/[department]/[Department].module.css`
4. API routes: `/pages/api/admin/[department]/...`

#### Example: Customer Service Dashboard
**File:** `pages/admin/customer-service/index.tsx`
```typescript
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';

export default function CustomerServiceDashboard() {
  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Customer Service Dashboard"
      description="Subscription management and customer support"
    >
      {/* Dashboard content */}
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
```

### Step 4: Implement Shared Features

#### A. Kanban Board System
**Files to create:**
- `components/admin/shared/KanbanBoard.tsx`
- `pages/admin/[department]/kanban.tsx` (for each department)
- `pages/api/admin/kanban/[...slug].ts`

Use existing `projects` table with added department filtering.

#### B. Activity Feed
**Files to create:**
- `components/admin/shared/ActivityFeed.tsx`
- `pages/admin/[department]/activity.tsx`
- `pages/api/admin/activity/feed.ts`

Uses `staff_activity_feed` table already created.

#### C. Notifications
**Files to create:**
- `components/admin/shared/NotificationBell.tsx`
- `pages/admin/[department]/notifications.tsx`
- `pages/api/admin/notifications/...`

Uses existing `notifications` table.

#### D. Announcements
**Files to create:**
- `components/admin/shared/AnnouncementBanner.tsx`
- `pages/admin/[department]/announcements.tsx`
- `pages/admin/super/announcements/new.tsx` (Super Admin only)
- `pages/api/admin/announcements/...`

Uses `staff_announcements` table already created.

### Step 5: Create Department-Specific Features

#### Super Admin (`/admin/super/`)
- `users/index.tsx` - User & Role Management
- `permissions/index.tsx` - Permission Controls
- `config/index.tsx` - System Configuration
- `audit-logs/index.tsx` - Audit Logs
- `access/index.tsx` - Cross-Dashboard Access

#### Customer Service (`/admin/customer-service/`)
- `subscriptions/index.tsx` - Subscription Management (use existing `/admin/subscriptions`)
- `orders/index.tsx` - Purchase & Billing (use existing `/admin/orders`)
- `users/index.tsx` - User Account Management (use existing `/admin/members`)
- `support/index.tsx` - Support Tools
- `errors/index.tsx` - Error Resolution

#### Editorial (`/admin/editorial/`)
- Use existing editorial pages:
  - `/admin/posts` → `/admin/editorial/articles`
  - `/admin/media` → `/admin/editorial/media`
  - `/admin/categories` → `/admin/editorial/taxonomy`
- Add new pages:
  - `authors/index.tsx`
  - `queue/index.tsx` - Publishing Queue

#### SUCCESS+ (`/admin/success-plus/`)
- `products/index.tsx` - Product Management
- `members/index.tsx` - Member Management
- `access/index.tsx` - Content Access Configuration
- `communications/index.tsx` - Member Communications
- `analytics/index.tsx` - SUCCESS+ Analytics

#### Dev (`/admin/dev/`)
- Use existing dev pages:
  - `/admin/devops` → `/admin/dev/`
- Add new pages:
  - `board/index.tsx` - Dev Board for non-code configuration
  - `monitoring/index.tsx` - System Monitoring (use existing `/admin/site-monitor`)
  - `deployments/index.tsx` - Deployment Management
  - `tools/index.tsx` - Technical Tools
  - `docs/index.tsx` - Documentation

#### Marketing (`/admin/marketing/`)
- Use existing marketing features:
  - `/admin/crm/campaigns` → `/admin/marketing/campaigns`
- Add new pages:
  - `landing-pages/index.tsx`
  - `email/index.tsx` - Email Marketing
  - `analytics/index.tsx` - Marketing Analytics
  - `promotions/index.tsx` - Promotions/Coupons

#### Coaching (`/admin/coaching/`)
- `programs/index.tsx` - Program Management
- `coaches/index.tsx` - Coach Management
- `clients/index.tsx` - Client Management
- `scheduling/index.tsx` - Session Scheduling
- `content/index.tsx` - Content Management
- `communications/index.tsx` - Client Messaging

### Step 6: Add Activity Logging to Existing Features

Wrap all existing admin API routes with activity logging:

```typescript
import { logActivity, ActivityActions } from '@/lib/activityLogger';

// Example: After creating a post
await logActivity({
  userId: session.user.id,
  userEmail: session.user.email,
  userName: session.user.name,
  department: Department.EDITORIAL,
  action: ActivityActions.POST_CREATED,
  entityType: 'Post',
  entityId: post.id,
  entityName: post.title,
  description: `Created new post: ${post.title}`,
});
```

### Step 7: Create API Routes for New Features

#### Notifications
```typescript
// GET /api/admin/notifications/count
// GET /api/admin/notifications/list
// POST /api/admin/notifications/mark-read
// POST /api/admin/notifications/mark-all-read
```

#### Announcements
```typescript
// GET /api/admin/announcements/list
// POST /api/admin/announcements/create (Super Admin only)
// PUT /api/admin/announcements/[id]
// DELETE /api/admin/announcements/[id]
```

#### Activity Feed
```typescript
// GET /api/admin/activity/feed?department=EDITORIAL
// GET /api/admin/activity/user/[userId]
```

#### Dashboard Stats
```typescript
// GET /api/admin/super/dashboard-stats
// GET /api/admin/customer-service/dashboard-stats
// GET /api/admin/editorial/dashboard-stats
// etc for each department
```

## Permission Matrix

| Feature | Super Admin | CS | Editorial | SUCCESS+ | Dev | Marketing | Coaching |
|---------|-------------|----|-----------| ---------|-----|-----------|----------|
| Kanban (view all) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kanban (edit own) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Activity Feed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Announcements (view) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Announcements (create) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| User/Role Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| System Config | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Subscriptions | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Articles | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| SUCCESS+ Product | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Marketing Campaigns | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Coaching Programs | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

## Security Considerations

1. **All department pages MUST use `requireDepartmentAuth()`**
2. **All API routes MUST verify department access**
3. **All write operations MUST log to `staff_activity_feed`**
4. **All page access MUST log to `department_access_log`**
5. **CSRF protection on all forms**
6. **Rate limiting on sensitive actions**
7. **Confirmation modals for destructive actions**

## Testing Checklist

- [ ] Super Admin can access all departments
- [ ] Admin role can access most departments (not Super Admin)
- [ ] Staff with single department assignment can ONLY access their department
- [ ] Shared features (Kanban, Activity, Notifications, Announcements) appear in all dashboards
- [ ] Activity feed shows actions from all departments
- [ ] Kanban board shows cards from all departments (read-only for other departments' cards)
- [ ] Announcements created by Super Admin appear in all departments
- [ ] Access denied page works for unauthorized department access
- [ ] Audit logging captures all sensitive actions
- [ ] Department access logging tracks all page views

## Next Steps

1. Create API routes for shared features (notifications, announcements, activity feed)
2. Build out each department's home dashboard with stats
3. Migrate existing admin pages to use DepartmentLayout
4. Implement Kanban board with department filtering
5. Build announcement creation/management for Super Admin
6. Add activity logging to all existing admin API routes
7. Create department-specific features per specification
8. Test all permission boundaries
9. Document for staff users

## Files Created (Summary)

### Database & Migration
- `prisma/schema.prisma` (updated)
- `scripts/add-admin-dashboard-tables.ts`

### Authentication & Authorization
- `lib/departmentAuth.ts`
- `lib/activityLogger.ts`

### Shared Components
- `components/admin/shared/DepartmentLayout.tsx`
- `components/admin/shared/DepartmentLayout.module.css`

### Documentation
- `ADMIN_DASHBOARD_IMPLEMENTATION.md` (this file)

## Estimated Remaining Work

- **Phase 2 (Core Dashboards)**: 20-30 hours
- **Phase 3 (Product Dashboards)**: 15-20 hours
- **Phase 4 (Shared Features)**: 10-15 hours
- **Testing & Refinement**: 10-15 hours

**Total: 55-80 hours**

This is a significant project that will provide a professional, scalable admin dashboard system for SUCCESS.com with proper role-based access control, audit logging, and department separation while maintaining cross-departmentvisibility through shared features.
