import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Department, UserRole } from '@/lib/types';

export interface DepartmentSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    primaryDepartment?: Department | null;
  };
}

// Permission matrix mapping departments to allowed roles
const DEPARTMENT_PERMISSIONS: Record<Department, UserRole[]> = {
  [Department.SUPER_ADMIN]: [UserRole.SUPER_ADMIN],
  [Department.CUSTOMER_SERVICE]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Department.EDITORIAL]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR],
  [Department.SUCCESS_PLUS]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Department.DEV]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Department.MARKETING]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [Department.COACHING]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
};

// Pages that Super Admin can always access
const SUPER_ADMIN_FULL_ACCESS = true;

/**
 * Check if a user has access to a specific department
 */
export function hasDepartmentAccess(
  userRole: UserRole,
  userDepartment: Department | null | undefined,
  targetDepartment: Department
): boolean {
  // Super Admin has access to all departments
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check if user's role is allowed for this department
  const allowedRoles = DEPARTMENT_PERMISSIONS[targetDepartment];
  if (!allowedRoles.includes(userRole)) {
    return false;
  }

  // For non-Super Admin, they must be assigned to this department
  // OR have ADMIN role which grants cross-department access
  if (userRole === 'ADMIN') {
    return true;
  }

  return userDepartment === targetDepartment;
}

/**
 * Require department authentication for a page
 * Usage: export const getServerSideProps = requireDepartmentAuth(Department.EDITORIAL);
 */
export function requireDepartmentAuth(
  requiredDepartment: Department
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<any>> => {
    const session = (await getServerSession(context.req, context.res, authOptions)) as DepartmentSession | null;

    // Not logged in
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/admin/login',
          permanent: false,
        },
      };
    }

    const { role, primaryDepartment } = session.user;

    // Check department access
    if (!hasDepartmentAccess(role, primaryDepartment, requiredDepartment)) {
      return {
        redirect: {
          destination: '/admin/access-denied',
          permanent: false,
        },
      };
    }

    // Pass session to page props - ensure all fields are serializable
    const serializableSession = {
      ...session,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        primaryDepartment: session.user.primaryDepartment || null,
      },
    };

    return {
      props: {
        session: serializableSession,
      },
    };
  };
}

/**
 * Get user's accessible departments
 */
export function getAccessibleDepartments(
  userRole: UserRole,
  primaryDepartment: Department | null | undefined
): Department[] {
  // Super Admin can access all departments
  if (userRole === UserRole.SUPER_ADMIN) {
    return Object.values(Department);
  }

  // Admin can access most departments
  if (userRole === UserRole.ADMIN) {
    return Object.values(Department).filter(dept => dept !== Department.SUPER_ADMIN);
  }

  // Other roles can only access their assigned department
  if (primaryDepartment) {
    return [primaryDepartment];
  }

  return [];
}

/**
 * Get department display name
 */
export function getDepartmentName(department: Department): string {
  const names: Record<Department, string> = {
    SUPER_ADMIN: 'Super Admin',
    CUSTOMER_SERVICE: 'Customer Service',
    EDITORIAL: 'Editorial',
    SUCCESS_PLUS: 'SUCCESS+',
    DEV: 'Dev',
    MARKETING: 'Marketing',
    COACHING: 'Coaching',
  };
  return names[department];
}

/**
 * Get department route base path
 */
export function getDepartmentPath(department: Department): string {
  const paths: Record<Department, string> = {
    SUPER_ADMIN: '/admin/super',
    CUSTOMER_SERVICE: '/admin/customer-service',
    EDITORIAL: '/admin/editorial',
    SUCCESS_PLUS: '/admin/success-plus',
    DEV: '/admin/dev',
    MARKETING: '/admin/marketing',
    COACHING: '/admin/coaching',
  };
  return paths[department];
}

/**
 * Log department access for audit trail
 */
export async function logDepartmentAccess(
  userId: string,
  userEmail: string,
  department: Department,
  pagePath: string,
  action: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('./supabase');
    const supabase = supabaseAdmin();

    await supabase
      .from('department_access_log')
      .insert({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userEmail,
        department,
        pagePath,
        action,
        ipAddress,
        userAgent,
      });
  } catch (error) {
    // Don't throw - logging failure shouldn't break the app
  }
}
