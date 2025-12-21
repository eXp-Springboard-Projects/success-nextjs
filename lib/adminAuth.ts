import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

/**
 * Server-side authentication guard for admin pages
 * Redirects unauthenticated users to login
 * Redirects non-admin users to dashboard
 */
export async function requireAdminAuth(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  // Ensure all session fields are serializable (no undefined values)
  const serializableSession = {
    ...session,
    user: {
      ...session.user,
      image: session.user.image || null,
    },
  };

  return { props: { session: serializableSession } };
}

/**
 * More restrictive auth - only ADMIN and SUPER_ADMIN
 */
export async function requireSuperAdminAuth(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    };
  }

  // Ensure all session fields are serializable (no undefined values)
  const serializableSession = {
    ...session,
    user: {
      ...session.user,
      image: session.user.image || null,
    },
  };

  return { props: { session: serializableSession } };
}
