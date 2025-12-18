# Department-Based Access Control System

## Overview

The admin dashboard now supports role-based department access control. Staff members can be assigned to one or multiple departments, and their navigation and access is automatically restricted based on these assignments.

## Features Implemented

### 1. Database Schema
- **New Department enum**: SUPER_ADMIN, CUSTOMER_SERVICE, EDITORIAL, SUCCESS_PLUS, DEV, MARKETING, COACHING
- **staff_departments table**: Many-to-many relationship between users and departments
- Super Admins automatically have access to all departments

### 2. API Endpoints

#### `/api/admin/departments/assign` (POST)
Assign departments to a user (Super Admin only)
```json
{
  "userId": "user-id",
  "departments": ["EDITORIAL", "MARKETING"]
}
```

#### `/api/admin/departments/user-departments` (GET)
Get departments assigned to a user
```
GET /api/admin/departments/user-departments?userId=user-id
```

#### `/api/admin/departments/check-access` (GET)
Check if current user has access to a specific department
```
GET /api/admin/departments/check-access?department=EDITORIAL
```

### 3. Department Dashboards

Each department has its own dashboard at:
- `/admin/super` - Super Admin dashboard
- `/admin/customer-service` - Customer Service dashboard
- `/admin/editorial` - Editorial dashboard
- `/admin/success-plus` - SUCCESS+ dashboard
- `/admin/dev` - Dev dashboard (to be created)
- `/admin/marketing` - Marketing dashboard (to be created)
- `/admin/coaching` - Coaching dashboard (to be created)

### 4. Access Control

**Middleware**: Routes starting with `/admin/*department*` check for department access
**HOC**: `withDepartmentAccess()` protects department-specific pages
**Helper Functions**: Located in `lib/auth/departmentAccess.ts`

### 5. Super Admin UI

The Users page (`/admin/users`) now includes:
- Department multi-select for assigning users to departments
- Department badges showing which departments each user has access to
- Only visible to Super Admins

### 6. Sidebar Navigation

The admin sidebar dynamically shows "My Departments" section with only the departments a user has access to.

## Usage

### Assigning Departments to Staff

1. Log in as Super Admin
2. Navigate to `/admin/users`
3. Click "Add User" or "Edit" on an existing user
4. Select one or more departments from the "Department Access" checkboxes
5. Save the user

### Creating a New Department Dashboard

```typescript
// pages/admin/your-department/index.tsx
import { withDepartmentAccess } from '@/lib/auth/departmentAccess';
import AdminLayout from '@/components/admin/AdminLayout';

function YourDepartmentDashboard() {
  return (
    <AdminLayout>
      {/* Your dashboard content */}
    </AdminLayout>
  );
}

export default withDepartmentAccess(YourDepartmentDashboard, {
  department: 'YOUR_DEPARTMENT',
});

export async function getServerSideProps() {
  return { props: {} };
}
```

### Protecting Individual Pages

Use the `withDepartmentAccess` HOC:
```typescript
export default withDepartmentAccess(YourComponent, {
  department: 'EDITORIAL',
});
```

### Checking Access Programmatically

```typescript
import { hasDepartmentAccess, getUserDepartments } from '@/lib/auth/departmentAccess';

// Check if user has access to a specific department
const hasAccess = await hasDepartmentAccess(userId, 'EDITORIAL');

// Get all departments a user has access to
const departments = await getUserDepartments(userId);
```

## Super Admin Special Privileges

- Automatically has access to ALL departments
- Can assign/revoke department access for other users
- Can view and operate within any department dashboard
- Sees all users' department assignments in the Users page

## Security

- All department access checks are server-side
- Middleware validates JWT tokens before checking department access
- Department assignments are logged in the activity_logs table
- Only Super Admins can modify department assignments

## Next Steps

To complete the system, create the remaining department dashboards:
- [ ] Dev dashboard (`/admin/dev`)
- [ ] Marketing dashboard (`/admin/marketing`)
- [ ] Coaching dashboard (`/admin/coaching`)

Each should follow the pattern established in `/admin/customer-service` and `/admin/editorial`.
