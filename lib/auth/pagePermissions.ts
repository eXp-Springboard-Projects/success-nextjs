/**
 * Page Permissions System
 * Handles role and department-based access control for admin pages
 */
import { prisma } from '@/lib/prisma';
import { UserRole, Department } from '@prisma/client';

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
    // Get user info
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        role: true,
        staff_departments: {
          select: { department: true },
        },
      },
    });

    if (!user) {
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
    const page = await prisma.page_permissions.findUnique({
      where: { pagePath },
      include: {
        role_permissions: true,
        department_permissions: true,
      },
    });

    // If page is not in permissions system, deny access by default
    if (!page || !page.isActive) {
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
    const rolePermission = page.role_permissions.find(
      (rp: { role: UserRole }) => rp.role === user.role
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
    const userDepartments = user.staff_departments.map(
      (sd: { department: Department }) => sd.department
    );

    for (const dept of userDepartments) {
      const deptPermission = page.department_permissions.find(
        (dp: { department: Department }) => dp.department === dept
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
    console.error('Error checking page permission:', error);
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
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        role: true,
        staff_departments: {
          select: { department: true },
        },
      },
    });

    if (!user) return [];

    // Super admins can access all pages
    if (user.role === 'SUPER_ADMIN') {
      const allPages = await prisma.page_permissions.findMany({
        where: { isActive: true },
        select: { pagePath: true },
      });
      return allPages.map((p: { pagePath: string }) => p.pagePath);
    }

    const accessiblePages = new Set<string>();

    // Get pages accessible by role
    const rolePages = await prisma.role_permissions.findMany({
      where: {
        role: user.role,
        canAccess: true,
      },
      include: {
        page: true,
      },
    });

    rolePages.forEach((rp: { page: { pagePath: string; isActive: boolean } }) => {
      if (rp.page.isActive) {
        accessiblePages.add(rp.page.pagePath);
      }
    });

    // Get pages accessible by department
    const userDepartments = user.staff_departments.map(
      (sd: { department: Department }) => sd.department
    );

    const deptPages = await prisma.department_permissions.findMany({
      where: {
        department: { in: userDepartments },
        canAccess: true,
      },
      include: {
        page: true,
      },
    });

    deptPages.forEach((dp: { page: { pagePath: string; isActive: boolean } }) => {
      if (dp.page.isActive) {
        accessiblePages.add(dp.page.pagePath);
      }
    });

    return Array.from(accessiblePages);
  } catch (error) {
    console.error('Error getting accessible pages:', error);
    return [];
  }
}

/**
 * Initialize default permissions for common admin pages
 */
export async function initializeDefaultPermissions() {
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
    await prisma.page_permissions.upsert({
      where: { pagePath: pageData.pagePath },
      create: pageData,
      update: {
        displayName: pageData.displayName,
        description: pageData.description,
        category: pageData.category,
      },
    });
  }

}
