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
        if (!credentials?.email || !credentials?.password) {
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
          logger.debug('User not found', { email: credentials.email });
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          logger.debug('Invalid password', { email: credentials.email });
          throw new Error('Invalid credentials');
        }

        logger.info('User authenticated', { email: user.email, role: user.role });

        // Update last login timestamp with raw query
        await prisma.$executeRaw`
          UPDATE users
          SET "lastLoginAt" = ${new Date()}, "updatedAt" = ${new Date()}
          WHERE id = ${user.id}
        `;

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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
        token.hasChangedDefaultPassword = user.hasChangedDefaultPassword;
        token.membershipTier = user.membershipTier || 'FREE';
        logger.debug('JWT callback - setting role', { role: user.role });
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.hasChangedDefaultPassword = token.hasChangedDefaultPassword;
        session.user.membershipTier = token.membershipTier || 'FREE';
        logger.debug('Session callback', { role: token.role });
      }
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
