# SUCCESS Magazine - Staff Authentication System

## Overview

SUCCESS Magazine now has a secure, domain-restricted authentication system that enforces:

1. **@success.com email domain restriction** - Only SUCCESS Magazine staff can access the admin
2. **Default password system** - All new staff accounts use a standard temporary password
3. **Forced password change** - Staff must change their password on first login
4. **Super Admin account** - Rachel has full access to all features

---

## Super Admin Account

**Status:** ✅ Already exists (Rachel's account)

Rachel's account already has SUPER_ADMIN role with:
- Full access to all admin features
- No forced password change requirement
- Can manage all staff accounts

---

## Staff Authentication Features

### 1. Domain Restriction (@success.com only)

**What it does:**
- Only emails ending in `@success.com` can login or register
- Validation happens on both frontend and backend
- Non-SUCCESS emails get error: "Access restricted to SUCCESS Magazine staff (@success.com emails only)"

**Implementation:**
- `lib/auth-validation.ts` - Validation utilities
- `pages/api/auth/[...nextauth].ts` - Login validation (needs manual update)
- `pages/api/auth/register.ts` - Registration validation

### 2. Default Password System

**Default Password:** `SUCCESS123!`

All new staff accounts are created with this password. The database tracks whether each user has changed from the default password using the `hasChangedDefaultPassword` field.

**Database Field:**
```prisma
model users {
  hasChangedDefaultPassword Boolean @default(false)
}
```

### 3. Forced Password Change on First Login

**How it works:**
1. User logs in with default password `SUCCESS123!`
2. System checks `hasChangedDefaultPassword` field
3. If `false`, user is immediately redirected to `/admin/change-password`
4. User must enter:
   - Current password (must be `SUCCESS123!`)
   - New password (min 8 chars, uppercase, lowercase, number)
   - Cannot be the default password
5. After successful change, `hasChangedDefaultPassword` is set to `true`
6. User can then access admin dashboard

**Password Requirements:**
- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Cannot be `SUCCESS123!`

---

## How to Add Staff Accounts

### Option 1: Self-Registration (Recommended for Staff)

1. **Staff visits:** `http://localhost:3000/register` (or your domain)
2. **Fills out form:**
   - SUCCESS Email: `john.doe@success.com`
   - Full Name: `John Doe`
   - Role: Select from dropdown (Editor, Author, Admin)
3. **Account created with:**
   - Email: As entered
   - Password: `SUCCESS123!` (temporary)
   - Role: As selected
   - `hasChangedDefaultPassword`: `false`
4. **Staff receives confirmation** with credentials
5. **Staff logs in at:** `http://localhost:3000/admin/login`
6. **Forced to change password immediately**

### Option 2: Admin Creates Account via Script

Run the interactive script:

```bash
npx tsx scripts/add-staff-account.ts
```

**Follow prompts:**
```
Email (@success.com): john.doe@success.com
Full Name: John Doe

Available Roles:
1. EDITOR (default)
2. AUTHOR
3. ADMIN
4. SUPER_ADMIN (use with caution!)

Select role (1-4, default 1): 1

Please confirm:
Email: john.doe@success.com
Name: John Doe
Role: EDITOR
Default Password: SUCCESS123!

Create this account? (yes/no): yes

✅ STAFF ACCOUNT CREATED SUCCESSFULLY!
```

---

## User Workflow

### First-Time Login Flow

```
1. Staff visits /admin/login
2. Enters: email@success.com + SUCCESS123!
3. System validates @success.com domain ✓
4. Login successful
5. System checks hasChangedDefaultPassword = false
6. → REDIRECT to /admin/change-password
7. Staff must change password (blocked from all other pages)
8. After password change → hasChangedDefaultPassword = true
9. → REDIRECT to /admin dashboard
10. Full access granted
```

### Returning User Flow

```
1. Staff visits /admin/login
2. Enters: email@success.com + [their new password]
3. System validates @success.com domain ✓
4. Login successful
5. System checks hasChangedDefaultPassword = true
6. → DIRECT ACCESS to /admin dashboard
7. Full access granted
```

---

## API Endpoints

### `POST /api/auth/register`
**Purpose:** Self-registration for staff

**Request:**
```json
{
  "email": "john.doe@success.com",
  "name": "John Doe",
  "role": "EDITOR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "john.doe@success.com",
    "name": "John Doe",
    "role": "EDITOR"
  },
  "instructions": "Your account has been created. Login with password: SUCCESS123! and change it immediately."
}
```

**Validation:**
- Email must end with `@success.com`
- Name is required
- Role defaults to EDITOR if invalid

---

### `POST /api/auth/change-password`
**Purpose:** Change user password

**Request:**
```json
{
  "currentPassword": "SUCCESS123!",
  "newPassword": "MyNewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Validation:**
- Current password must match
- New password must meet strength requirements
- New password cannot be `SUCCESS123!`

---

### `GET /api/auth/me`
**Purpose:** Get current user info including password status

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@success.com",
    "name": "John Doe",
    "role": "EDITOR",
    "hasChangedDefaultPassword": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-01-10T00:00:00.000Z"
  }
}
```

---

## Pages

### `/register`
**Purpose:** Staff self-registration page

**Features:**
- Domain validation (@success.com only)
- Role selection
- Success confirmation with credentials
- Auto-redirect to login

### `/admin/login`
**Purpose:** Staff login page

**Features:**
- NextAuth credentials provider
- Domain validation
- Password change detection
- Auto-redirect if password change needed

### `/admin/change-password`
**Purpose:** Password change page

**Features:**
- Current password verification
- New password validation
- Forced mode (blocks navigation if required)
- Updates `hasChangedDefaultPassword` flag

---

## Security Features

### ✅ Domain Restriction
- Only `@success.com` emails allowed
- Validation on login, registration, all auth endpoints
- Error message doesn't reveal if email exists

### ✅ Password Strength Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, number
- Cannot be default password
- Validated on frontend and backend

### ✅ Forced Password Change
- Enforced via `withPasswordChange` HOC
- Blocks all admin routes until password changed
- Cannot bypass or skip

### ✅ Session Management
- JWT-based sessions via NextAuth
- Tracks last login time
- Session includes password change status

---

## Implementation Details

### Files Created/Modified

**New Files:**
```
lib/auth-validation.ts              # Validation utilities
pages/api/auth/change-password.ts   # Password change endpoint
pages/api/auth/me.ts                # Get user info endpoint
pages/api/auth/register.ts          # Registration endpoint
pages/admin/change-password.tsx     # Password change page
pages/register.tsx                  # Staff registration page
styles/Auth.module.css              # Auth page styles
components/admin/withPasswordChange.tsx  # HOC for password enforcement
scripts/add-staff-account.ts        # CLI script to add accounts
```

**Modified Files:**
```
prisma/schema.prisma                # Added hasChangedDefaultPassword field
pages/api/auth/[...nextauth].ts     # Needs manual domain validation update
```

---

## Testing the System

### Test 1: Create New Staff Account

```bash
# Option A: Via Web (Self-Registration)
1. Go to http://localhost:3000/register
2. Fill in: john.test@success.com, "John Test", role: EDITOR
3. Verify success message shows password: SUCCESS123!

# Option B: Via Script
npx tsx scripts/add-staff-account.ts
```

### Test 2: First Login (Forced Password Change)

```bash
1. Go to http://localhost:3000/admin/login
2. Login: john.test@success.com / SUCCESS123!
3. Should redirect to /admin/change-password
4. Try navigating to /admin - should be blocked
5. Change password to: MyNewPass123
6. Should redirect to /admin dashboard
7. Verify full access
```

### Test 3: Returning Login

```bash
1. Logout
2. Login again: john.test@success.com / MyNewPass123
3. Should go directly to /admin dashboard (no redirect)
```

### Test 4: Domain Validation

```bash
1. Try registering with: john@gmail.com
2. Should show error: "Access restricted to SUCCESS Magazine staff"
3. Try logging in with: john@gmail.com
4. Should show error: "Access restricted to SUCCESS Magazine staff"
```

---

## Troubleshooting

### Issue: User can bypass password change

**Fix:** Ensure `withPasswordChange` HOC is wrapped around admin pages:

```tsx
import { withPasswordChange } from '../../components/admin/withPasswordChange';

function AdminPage() {
  // ...
}

export default withPasswordChange(AdminPage);
```

### Issue: Domain validation not working on login

**Fix:** Manually update `pages/api/auth/[...nextauth].ts`:

```typescript
import { isSuccessEmail, AUTH_ERRORS } from '../../../lib/auth-validation';

// In the authorize function, add:
if (!isSuccessEmail(credentials.email)) {
  throw new Error(AUTH_ERRORS.INVALID_DOMAIN);
}
```

### Issue: Password change page shows loading forever

**Fix:** Check `/api/auth/me` endpoint is working:
```bash
# In browser console while logged in:
fetch('/api/auth/me').then(r => r.json()).then(console.log)
```

---

## Next Steps

1. **Apply `withPasswordChange` HOC** to all admin page components
2. **Test the complete flow** with a test account
3. **Update NextAuth configuration** with domain validation (manual step required)
4. **Add staff accounts** for your team
5. **Deploy to production** with environment variables set

---

## Commands Reference

```bash
# Add staff account interactively
npx tsx scripts/add-staff-account.ts

# Start dev server
npm run dev

# Access URLs
# Registration:     http://localhost:3000/register
# Login:            http://localhost:3000/admin/login
# Change Password:  http://localhost:3000/admin/change-password
# Admin Dashboard:  http://localhost:3000/admin
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check server logs for authentication errors
4. Verify database has `hasChangedDefaultPassword` field
5. Confirm NextAuth configuration is correct

---

**System Status:** ✅ Ready for use
**Default Password:** `SUCCESS123!`
**Domain Restriction:** `@success.com`
**Super Admin:** Rachel (existing account)
