import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '../../../lib/logger';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] Authorize called with email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          throw new Error('Email and password required');
        }

        // Use raw query to avoid schema mismatch
        const users = await prisma.$queryRaw<any[]>`
          SELECT id, email, name, password, role, avatar,
                 "hasChangedDefaultPassword", "lastLoginAt"
          FROM users
          WHERE email = ${credentials.email}
        `;

        const user = users[0];

        if (!user) {
          console.log('[NextAuth] User not found:', credentials.email);
          logger.debug('User not found', { email: credentials.email });
          throw new Error('Invalid credentials');
        }

        console.log('[NextAuth] User found, checking password...');
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log('[NextAuth] Invalid password for:', credentials.email);
          logger.debug('Invalid password', { email: credentials.email });
          throw new Error('Invalid credentials');
        }

        console.log('[NextAuth] Password valid, user authenticated:', user.email, user.role);
        logger.info('User authenticated', { email: user.email, role: user.role });

        // Update last login timestamp with raw query
        await prisma.$executeRaw`
          UPDATE users
          SET "lastLoginAt" = ${new Date()}, "updatedAt" = ${new Date()}
          WHERE id = ${user.id}
        `;

        console.log('[NextAuth] Returning user object:', { id: user.id, email: user.email, role: user.role });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          hasChangedDefaultPassword: user.hasChangedDefaultPassword || false,
          membershipTier: 'FREE', // Default for now
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[NextAuth] JWT callback called, user:', user ? user.email : 'none');
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
        token.hasChangedDefaultPassword = user.hasChangedDefaultPassword;
        token.membershipTier = user.membershipTier || 'FREE';
        console.log('[NextAuth] JWT callback - setting role:', user.role);
        logger.debug('JWT callback - setting role', { role: user.role });
      }
      console.log('[NextAuth] JWT callback returning token with role:', token.role);
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth] Session callback called, token role:', token?.role);
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.hasChangedDefaultPassword = token.hasChangedDefaultPassword;
        session.user.membershipTier = token.membershipTier || 'FREE';
        console.log('[NextAuth] Session callback - setting user role:', token.role);
        logger.debug('Session callback', { role: token.role });
      }
      console.log('[NextAuth] Session callback returning session for:', session.user?.email);
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 8 * 60 * 60, // 🔒 SECURITY: 8 hours - session expires
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 🔒 SECURITY: 8 hours - token expires
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // Required for production HTTPS
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
