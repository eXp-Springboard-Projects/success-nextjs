# ⚠️ MANUAL UPDATE REQUIRED: NextAuth Configuration

## File to Update
`pages/api/auth/[...nextauth].ts`

## What to Change

### 1. Add Import at the Top

**Add this line after the existing imports:**
```typescript
import { isSuccessEmail, AUTH_ERRORS } from '../../../lib/auth-validation';
```

**Full imports section should look like:**
```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { isSuccessEmail, AUTH_ERRORS } from '../../../lib/auth-validation';  // ← ADD THIS
```

---

### 2. Add Domain Validation in authorize()

**Find this code (around line 14-17):**
```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error('Email and password required');
  }

  const user = await prisma.users.findUnique({
```

**Add domain validation AFTER the credentials check:**
```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error('Email and password required');
  }

  // ADD THIS BLOCK ↓
  // Domain validation - only allow @success.com emails
  if (!isSuccessEmail(credentials.email)) {
    throw new Error(AUTH_ERRORS.INVALID_DOMAIN);
  }
  // ↑ END OF NEW CODE

  const user = await prisma.users.findUnique({
```

---

### 3. Update Last Login Time

**Find this code (around line 31-36):**
```typescript
if (!isPasswordValid) {
  throw new Error('Invalid credentials');
}

console.log('User authenticated:', { email: user.email, role: user.role });

return {
```

**Replace with:**
```typescript
if (!isPasswordValid) {
  throw new Error('Invalid credentials');
}

// ADD THIS BLOCK ↓
// Update last login time
await prisma.users.update({
  where: { id: user.id },
  data: { lastLoginAt: new Date() }
});
// ↑ END OF NEW CODE

console.log('User authenticated:', { email: user.email, role: user.role, hasChangedPassword: user.hasChangedDefaultPassword });

return {
```

---

### 4. Add hasChangedDefaultPassword to Return Object

**Find the return statement (around line 38-44):**
```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
};
```

**Replace with:**
```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  hasChangedDefaultPassword: user.hasChangedDefaultPassword,  // ← ADD THIS
};
```

---

### 5. Update JWT Callback

**Find the jwt callback (around line 49-56):**
```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.avatar = user.avatar;
    console.log('JWT callback - setting role:', user.role);
  }
  return token;
},
```

**Replace with:**
```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.avatar = user.avatar;
    token.hasChangedDefaultPassword = user.hasChangedDefaultPassword;  // ← ADD THIS
    console.log('JWT callback - setting role:', user.role);
  }
  return token;
},
```

---

### 6. Update Session Callback

**Find the session callback (around line 58-65):**
```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.avatar = token.avatar;
    console.log('Session callback - user role:', token.role);
  }
  return session;
},
```

**Replace with:**
```typescript
async session({ session, token }) {
  if (token) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.avatar = token.avatar;
    session.user.hasChangedDefaultPassword = token.hasChangedDefaultPassword;  // ← ADD THIS
    console.log('Session callback - user role:', token.role);
  }
  return session;
},
```

---

## Complete Updated File

Here's what the complete file should look like:

```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { isSuccessEmail, AUTH_ERRORS } from '../../../lib/auth-validation';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // Domain validation - only allow @success.com emails
        if (!isSuccessEmail(credentials.email)) {
          throw new Error(AUTH_ERRORS.INVALID_DOMAIN);
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login time
        await prisma.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        console.log('User authenticated:', { email: user.email, role: user.role, hasChangedPassword: user.hasChangedDefaultPassword });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          hasChangedDefaultPassword: user.hasChangedDefaultPassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
        token.hasChangedDefaultPassword = user.hasChangedDefaultPassword;
        console.log('JWT callback - setting role:', user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.hasChangedDefaultPassword = token.hasChangedDefaultPassword;
        console.log('Session callback - user role:', token.role);
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
```

---

## Why This Update is Needed

This update adds:
1. ✅ Domain validation (@success.com only)
2. ✅ Password change status tracking
3. ✅ Last login time tracking
4. ✅ Session includes password change flag for middleware

Without this update:
- ❌ Domain validation won't work on login
- ❌ Password change enforcement won't work
- ❌ Non-SUCCESS emails could potentially login

---

## After Making Changes

1. Save the file
2. Restart your dev server: `npm run dev`
3. Test login with a @success.com email ✓
4. Test login with a non-@success.com email (should fail) ✓
5. Test password change flow ✓
