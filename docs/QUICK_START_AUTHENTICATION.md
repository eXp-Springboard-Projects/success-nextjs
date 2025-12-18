# Quick Start: Staff Authentication System

## ✅ System Ready!

Your SUCCESS Magazine authentication system is now configured with:
- ✅ Domain restriction (@success.com only)
- ✅ Default password system (SUCCESS123!)
- ✅ Forced password change on first login
- ✅ Rachel's super admin account (already exists)

---

## 🚀 Quick Actions

### Add a New Staff Member

**Option 1: Staff Self-Registers (Easiest)**
1. Send staff to: `http://localhost:3000/register`
2. They fill in their @success.com email and name
3. They get temporary password: `SUCCESS123!`
4. They login and must change password immediately

**Option 2: You Add Them via Script**
```bash
npx tsx scripts/add-staff-account.ts
```
Follow the prompts to create their account.

---

## 📝 What Staff Need to Know

### For New Staff Members:

**Registration (if self-registering):**
1. Go to: `http://localhost:3000/register`
2. Use your @success.com email
3. Choose your role (Editor, Author, or Admin)
4. You'll get temporary password: `SUCCESS123!`

**First Login:**
1. Go to: `http://localhost:3000/admin/login`
2. Email: `your.email@success.com`
3. Password: `SUCCESS123!`
4. You'll be forced to change your password
5. New password must be:
   - At least 8 characters
   - Include uppercase letter
   - Include lowercase letter
   - Include number
6. After changing password, you're all set!

**Returning Logins:**
- Just use your email and new password
- Go straight to admin dashboard

---

## 🔒 Security Rules

### Who Can Access:
- ✅ Only @success.com emails
- ✅ Must change default password on first login
- ✅ Password requirements enforced

### Who Cannot Access:
- ❌ Non-@success.com emails
- ❌ Users who haven't changed default password (blocked until they do)

---

## 🧪 Test the System

### Test with a new account:

```bash
# Create test account
npx tsx scripts/add-staff-account.ts
# Enter: test.user@success.com, "Test User", role 1 (EDITOR)

# Test login flow:
1. Go to http://localhost:3000/admin/login
2. Login with: test.user@success.com / SUCCESS123!
3. You'll be redirected to change password page
4. Change password to something like: TestPass123
5. You'll be redirected to admin dashboard
6. Logout and login again with new password
7. Should go straight to dashboard (no redirect)
```

---

## 📍 Important URLs

- **Staff Registration:** `/register`
- **Admin Login:** `/admin/login`
- **Change Password:** `/admin/change-password` (auto-redirected if needed)
- **Admin Dashboard:** `/admin`

---

## 🎯 Key Details

**Default Password:** `SUCCESS123!`
**Domain:** `@success.com` only
**Roles Available:**
- EDITOR (default, basic content editing)
- AUTHOR (content creation)
- ADMIN (site management)
- SUPER_ADMIN (Rachel - full access)

---

## 💡 Common Questions

**Q: Can staff choose their own password during registration?**
A: No, everyone gets `SUCCESS123!` initially and must change it on first login for security.

**Q: What if staff forget their new password?**
A: You'll need to reset it via the database or add a forgot password feature (not yet implemented).

**Q: Can staff use non-@success.com emails?**
A: No, the system only accepts @success.com emails to ensure only SUCCESS Magazine staff have access.

**Q: What if someone tries to bypass the password change?**
A: They can't. The system blocks all admin pages until they change their password.

**Q: Can I bulk import staff?**
A: Not yet, but you can run the script multiple times or create a bulk import script if needed.

---

## 🛠️ Troubleshooting

### Staff can't register
- Verify they're using an @success.com email
- Check database connection
- Check browser console for errors

### Staff stuck on change password page
- Verify they're entering current password correctly: `SUCCESS123!`
- Ensure new password meets requirements (8+ chars, uppercase, lowercase, number)
- Check browser console for errors

### Domain validation not working
- Check `pages/api/auth/[...nextauth].ts` has been manually updated with domain validation
- See STAFF_AUTHENTICATION_SYSTEM.md for instructions

---

## 📚 Full Documentation

For detailed technical information, see:
**STAFF_AUTHENTICATION_SYSTEM.md**

---

**Ready to use!** 🎉

Add your first staff member now:
```bash
npx tsx scripts/add-staff-account.ts
```
