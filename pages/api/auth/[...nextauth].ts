import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '../../../lib/supabase';
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

        // Use Supabase to query users - using snake_case column names
        const supabase = supabaseAdmin();
        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, password, role, avatar, has_changed_default_password, last_login_at')
          .eq('email', credentials.email)
          .limit(1);

        if (error) {
          console.log('[NextAuth] Database error:', error);
          logger.error('Database error during login', { error: error.message });
          throw new Error('Database error');
        }

        const user = users?.[0];

        if (!user) {
          console.log('[NextAuth] User not found:', credentials.email);
          logger.debug('User not found', { email: credentials.email });
          throw new Error('Invalid credentials');
        }

        // Block PENDING users from logging in
        if (user.role === 'PENDING') {
          console.log('[NextAuth] User account is pending approval:', credentials.email);
          logger.debug('User account pending approval', { email: credentials.email });
          throw new Error('Your account is pending approval. Please wait for admin confirmation.');
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

        // Update last login timestamp with Supabase - using snake_case
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        const userName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email;
        console.log('[NextAuth] Returning user object:', { id: user.id, email: user.email, role: user.role });
        return {
          id: user.id,
          email: user.email,
          name: userName,
          role: user.role,
          avatar: user.avatar,
          hasChangedDefaultPassword: user.has_changed_default_password || false,
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
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
};

export default NextAuth(authOptions);
