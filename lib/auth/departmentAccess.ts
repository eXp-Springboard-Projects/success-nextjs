import { supabaseAdmin } from '@/lib/supabase';
import { Department } from '@/lib/types';

/**
 * Check if a user has access to a specific department
 */
export async function hasDepartmentAccess(
  userId: string,
  department: Department
): Promise<boolean> {
  const supabase = supabaseAdmin();

  // Super admins have access to everything
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  // Check if user is assigned to this department
  const { data: assignment, error: assignError } = await supabase
    .from('staff_departments')
    .select('*')
    .eq('userId', userId)
    .eq('department', department)
    .single();

  return !!assignment && !assignError;
}

/**
 * Get all departments a user has access to
 */
export async function getUserDepartments(userId: string): Promise<Department[]> {
  const supabase = supabaseAdmin();

  // Super admins have access to all departments
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) return [];

  if (user.role === 'SUPER_ADMIN') {
    return [
      Department.SUPER_ADMIN,
      Department.CUSTOMER_SERVICE,
      Department.EDITORIAL,
      Department.SUCCESS_PLUS,
      Department.DEV,
      Department.MARKETING,
      Department.COACHING,
    ];
  }

  // Get assigned departments
  const { data: assignments, error: assignError } = await supabase
    .from('staff_departments')
    .select('department')
    .eq('userId', userId);

  if (assignError || !assignments) return [];

  return assignments.map((a: { department: Department }) => a.department);
}

/**
 * Get department from route path
 */
export function getDepartmentFromPath(pathname: string): Department | null {
  if (pathname.startsWith('/admin/super')) return Department.SUPER_ADMIN;
  if (pathname.startsWith('/admin/customer-service')) return Department.CUSTOMER_SERVICE;
  if (pathname.startsWith('/admin/editorial')) return Department.EDITORIAL;
  if (pathname.startsWith('/admin/success-plus')) return Department.SUCCESS_PLUS;
  if (pathname.startsWith('/admin/dev')) return Department.DEV;
  if (pathname.startsWith('/admin/marketing')) return Department.MARKETING;
  if (pathname.startsWith('/admin/coaching')) return Department.COACHING;
  return null;
}

/**
 * Get route prefix for a department
 */
export function getDepartmentRoute(department: Department): string {
  const routes: Record<Department, string> = {
    SUPER_ADMIN: '/admin/super',
    CUSTOMER_SERVICE: '/admin/customer-service',
    EDITORIAL: '/admin/editorial',
    SUCCESS_PLUS: '/admin/success-plus',
    DEV: '/admin/dev',
    MARKETING: '/admin/marketing',
    COACHING: '/admin/coaching',
  };
  return routes[department];
}
