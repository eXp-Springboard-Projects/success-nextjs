# Staff Management Section Audit Report

## Current Status

### ✅ WORKING Pages
1. **`/admin/staff`** → `pages/admin/staff/index.tsx`
   - Staff list/table view
   - Stats dashboard
   - Bulk operations toggle
   - **HAS**: `getServerSideProps()` ✓

2. **`/admin/staff/invite`** → `pages/admin/staff/invite.tsx`
   - Invite form
   - Department selection
   - Recent invites list
   - **HAS**: `getServerSideProps()` ✓

### ❌ BROKEN Links (404 Errors)
1. **`/admin/staff/[id]`** → View staff member details
   - **Linked from**: Staff list page (line 234)
   - **Status**: Page does NOT exist
   - **Button**: 👁️ "View Details"

2. **`/admin/staff/[id]/edit`** → Edit staff member
   - **Linked from**: Staff list page (line 241)
   - **Status**: Page does NOT exist
   - **Button**: ✏️ "Edit"

### 🟡 API Endpoints

#### Working:
- `/api/admin/staff` → List all staff (staff.js)
- `/api/admin/staff/bulk-assign.ts` → Bulk operations
- `/api/admin/staff/bulk-transfer.ts` → Bulk operations
- `/api/admin/invites/create.ts` → Create invite
- `/api/admin/invites/list.ts` → List invites

#### Missing:
- `/api/admin/staff/[id]` → Get single staff member
- `/api/admin/staff/[id]` (PUT/PATCH) → Update staff member

### 🟡 Components
- **BulkStaffOperations** → Referenced but need to verify it works

## Root Cause Analysis

### Why `/admin/staff/invite` Shows 404

**Possible Issues:**

1. **AWS Amplify Build Cache**
   - Amplify may not have rebuilt after the route restructuring
   - Build may be using cached version

2. **Missing from Build Output**
   - Page may not be getting included in standalone build
   - Check `.next/standalone/pages/admin/staff/` after build

3. **Routing Conflict Still Present**
   - Double-check no other files conflict with `/staff` route

## Implementation Plan

### Phase 1: Create Missing Pages (Priority: HIGH)

#### 1. Create `/admin/staff/[id].tsx` - View Staff Details
**Purpose**: Display full staff member profile
**Features**:
- Staff member info (name, email, role)
- Department assignments
- Activity history
- Posts authored
- Login history
- Edit button → links to edit page

#### 2. Create `/admin/staff/[id]/edit.tsx` - Edit Staff Member
**Purpose**: Edit staff member details
**Features**:
- Edit name, email
- Change role
- Assign/remove departments (Super Admin only)
- Deactivate account
- Reset password option
- Activity log

### Phase 2: Create Missing API Endpoints

#### 1. `/api/admin/staff/[id].ts`
**Methods**: GET, PUT, DELETE
**GET**: Fetch single staff member with departments
**PUT**: Update staff member
**DELETE**: Deactivate staff member

### Phase 3: Fix Amplify Deployment

#### Option A: Force Rebuild
1. Clear Amplify build cache
2. Trigger manual rebuild
3. Verify routes in build output

#### Option B: Add Amplify-specific Config
```javascript
// In next.config.js or amplify.yml
experimental: {
  outputFileTracingRoot: path.join(__dirname, '../../'),
}
```

#### Option C: Use Rewrites
```javascript
// In next.config.js
async rewrites() {
  return [
    {
      source: '/admin/staff/invite',
      destination: '/admin/staff/invite',
    },
  ];
}
```

### Phase 4: Testing Checklist

- [ ] `/admin/staff` loads correctly
- [ ] `/admin/staff/invite` loads (currently 404)
- [ ] Clicking "Invite Staff" button works
- [ ] Clicking "View Details" (👁️) loads staff detail page
- [ ] Clicking "Edit" (✏️) loads edit page
- [ ] Bulk operations toggle works
- [ ] Can create invites with departments
- [ ] Can view and edit staff member details
- [ ] Department assignments save correctly

## File Structure (Proposed)

```
pages/
  admin/
    staff/
      index.tsx              ✅ EXISTS (Staff list)
      invite.tsx             ✅ EXISTS (Invite form) - but 404 on Amplify
      [id].tsx               ❌ MISSING (View details)
      [id]/
        edit.tsx             ❌ MISSING (Edit form)
      Staff.module.css       ✅ EXISTS
      StaffInvite.module.css ✅ EXISTS

api/
  admin/
    staff.js                 ✅ EXISTS (List API)
    staff/
      [id].ts                ❌ MISSING (Single staff API)
      bulk-assign.ts         ✅ EXISTS
      bulk-transfer.ts       ✅ EXISTS
```

## Immediate Actions

1. **Create `[id].tsx`** - Staff detail view page
2. **Create `[id]/edit.tsx`** - Staff edit page
3. **Create `/api/admin/staff/[id].ts`** - Single staff API
4. **Debug Amplify deployment** - Why is invite page 404?
5. **Test all routes locally** with `npm run build && npm start`
6. **Push and verify** on Amplify

## Notes

- All admin pages use `getServerSideProps()` for SSR (required for Amplify standalone mode)
- Department system is already in place (from previous work)
- Need to integrate department management into edit page
- BulkStaffOperations component needs verification
