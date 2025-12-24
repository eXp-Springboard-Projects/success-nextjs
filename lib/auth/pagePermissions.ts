/**
 * Page Permissions System
 * Handles role and department-based access control for admin pages
 */
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole, Department } from '@/lib/types';

export interface PagePermission {
  canAccess: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionCheckResult extends PagePermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a user has permission to access a page
 */
export async function checkPagePermission(
  userId: string,
  pagePath: string
): Promise<PermissionCheckResult> {
  try {
    const supabase = supabaseAdmin();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        role,
        staff_departments (
          department
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        allowed: false,
        canAccess: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        reason: 'User not found',
      };
    }

    // Super admins have full access to everything
    if (user.role === 'SUPER_ADMIN') {
      return {
        allowed: true,
        canAccess: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      };
    }

    // Get page permission configuration
    const { data: page, error: pageError } = await supabase
      .from('page_permissions')
      .select(`
        *,
        role_permissions (*),
        department_permissions (*)
      `)
      .eq('pagePath', pagePath)
      .single();

    // If page is not in permissions system, deny access by default
    if (pageError || !page || !page.isActive) {
      return {
        allowed: false,
        canAccess: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        reason: 'Page not configured in permissions system',
      };
    }

    // Check role-based permissions
    const rolePermission = page.role_permissions?.find(
      (rp: any) => rp.role === user.role
    );

    if (rolePermission && rolePermission.canAccess) {
      return {
        allowed: true,
        canAccess: rolePermission.canAccess,
        canCreate: rolePermission.canCreate,
        canEdit: rolePermission.canEdit,
        canDelete: rolePermission.canDelete,
      };
    }

    // Check department-based permissions
    const userDepartments = (user.staff_departments as any[] || []).map(
      (sd: any) => sd.department
    );

    for (const dept of userDepartments) {
      const deptPermission = page.department_permissions?.find(
        (dp: any) => dp.department === dept
      );

      if (deptPermission && deptPermission.canAccess) {
        return {
          allowed: true,
          canAccess: deptPermission.canAccess,
          canCreate: deptPermission.canCreate,
          canEdit: deptPermission.canEdit,
          canDelete: deptPermission.canDelete,
        };
      }
    }

    // No permission found
    return {
      allowed: false,
      canAccess: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      reason: 'No permission granted for this page',
    };
  } catch (error) {
    return {
      allowed: false,
      canAccess: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      reason: 'Error checking permissions',
    };
  }
}

/**
 * Get all pages a user can access
 */
export async function getUserAccessiblePages(userId: string): Promise<string[]> {
  try {
    const supabase = supabaseAdmin();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        role,
        staff_departments (
          department
        )
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) return [];

    // Super admins can access all pages
    if (user.role === 'SUPER_ADMIN') {
      const { data: allPages, error } = await supabase
        .from('page_permissions')
        .select('pagePath')
        .eq('isActive', true);

      if (error || !allPages) return [];
      return allPages.map((p: any) => p.pagePath);
    }

    const accessiblePages = new Set<string>();

    // Get pages accessible by role
    const { data: rolePages, error: roleError } = await supabase
      .from('role_permissions')
      .select(`
        page:page_permissions (
          pagePath,
          isActive
        )
      `)
      .eq('role', user.role)
      .eq('canAccess', true);

    if (!roleError && rolePages) {
      rolePages.forEach((rp: any) => {
        if (rp.page?.isActive) {
          accessiblePages.add(rp.page.pagePath);
        }
      });
    }

    // Get pages accessible by department
    const userDepartments = (user.staff_departments as any[] || []).map(
      (sd: any) => sd.department
    );

    if (userDepartments.length > 0) {
      const { data: deptPages, error: deptError } = await supabase
        .from('department_permissions')
        .select(`
          page:page_permissions (
            pagePath,
            isActive
          )
        `)
        .in('department', userDepartments)
        .eq('canAccess', true);

      if (!deptError && deptPages) {
        deptPages.forEach((dp: any) => {
          if (dp.page?.isActive) {
            accessiblePages.add(dp.page.pagePath);
          }
        });
      }
    }

    return Array.from(accessiblePages);
  } catch (error) {
    return [];
  }
}

/**
 * Initialize default permissions for common admin pages
 */
export async function initializeDefaultPermissions() {
  const supabase = supabaseAdmin();

  const defaultPages = [
    // Content Management
    {
      pagePath: '/admin/posts',
      displayName: 'Posts',
      description: 'Manage blog posts and articles',
      category: 'Content',
    },
    {
      pagePath: '/admin/pages',
      displayName: 'Pages',
      description: 'Manage static pages',
      category: 'Content',
    },
    {
      pagePath: '/admin/media',
      displayName: 'Media Library',
      description: 'Manage images and files',
      category: 'Content',
    },
    {
      pagePath: '/admin/categories',
      displayName: 'Categories',
      description: 'Manage content categories',
      category: 'Content',
    },
    {
      pagePath: '/admin/tags',
      displayName: 'Tags',
      description: 'Manage content tags',
      category: 'Content',
    },
    {
      pagePath: '/admin/comments',
      displayName: 'Comments',
      description: 'Moderate user comments',
      category: 'Content',
    },

    // User Management
    {
      pagePath: '/admin/users',
      displayName: 'Users',
      description: 'Manage user accounts',
      category: 'User Management',
    },
    {
      pagePath: '/admin/staff',
      displayName: 'Staff',
      description: 'Manage staff members',
      category: 'User Management',
    },
    {
      pagePath: '/admin/members',
      displayName: 'Members',
      description: 'Manage SUCCESS+ members',
      category: 'User Management',
    },

    // Analytics & Reports
    {
      pagePath: '/admin/analytics',
      displayName: 'Analytics',
      description: 'View site analytics and reports',
      category: 'Analytics',
    },
    {
      pagePath: '/admin/revenue',
      displayName: 'Revenue',
      description: 'View revenue and financial reports',
      category: 'Analytics',
    },
    {
      pagePath: '/admin/activity-log',
      displayName: 'Activity Log',
      description: 'View user activity logs',
      category: 'Analytics',
    },

    // Department-Specific
    {
      pagePath: '/admin/editorial',
      displayName: 'Editorial Dashboard',
      description: 'Editorial team dashboard',
      category: 'Departments',
    },
    {
      pagePath: '/admin/editorial-calendar',
      displayName: 'Editorial Calendar',
      description: 'Content planning calendar',
      category: 'Departments',
    },
    {
      pagePath: '/admin/customer-service',
      displayName: 'Customer Service',
      description: 'Customer service dashboard',
      category: 'Departments',
    },
    {
      pagePath: '/admin/success-plus',
      displayName: 'SUCCESS+',
      description: 'SUCCESS+ management dashboard',
      category: 'Departments',
    },
    {
      pagePath: '/admin/marketing',
      displayName: 'Marketing',
      description: 'Marketing dashboard',
      category: 'Departments',
    },

    // System
    {
      pagePath: '/admin/settings',
      displayName: 'Settings',
      description: 'System settings and configuration',
      category: 'System',
    },
    {
      pagePath: '/admin/plugins',
      displayName: 'Plugins',
      description: 'Manage plugins and integrations',
      category: 'System',
    },
    {
      pagePath: '/admin/seo',
      displayName: 'SEO',
      description: 'SEO settings and optimization',
      category: 'System',
    },
  ];

  for (const pageData of defaultPages) {
    // Check if page exists
    const { data: existing } = await supabase
      .from('page_permissions')
      .select('pagePath')
      .eq('pagePath', pageData.pagePath)
      .single();

    if (existing) {
      // Update existing page
      await supabase
        .from('page_permissions')
        .update({
          displayName: pageData.displayName,
          description: pageData.description,
          category: pageData.category,
        })
        .eq('pagePath', pageData.pagePath);
    } else {
      // Insert new page
      await supabase
        .from('page_permissions')
        .insert(pageData);
    }
  }
}
