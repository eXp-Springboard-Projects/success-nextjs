/**
 * API Endpoint: /api/admin/permissions/[pageId]
 * Update permissions for a specific page
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can manage permissions
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
  }

  const { pageId } = req.query;

  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ error: 'Invalid page ID' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await updatePermissions(pageId, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Permissions API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function updatePermissions(
  pageId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { rolePermissions, departmentPermissions } = req.body;

  // Verify page exists
  const page = await prisma.page_permissions.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  // Update role permissions
  if (rolePermissions && Array.isArray(rolePermissions)) {
    for (const rolePerm of rolePermissions) {
      await prisma.role_permissions.upsert({
        where: {
          pageId_role: {
            pageId,
            role: rolePerm.role,
          },
        },
        create: {
          pageId,
          role: rolePerm.role,
          canAccess: rolePerm.canAccess,
          canCreate: rolePerm.canCreate,
          canEdit: rolePerm.canEdit,
          canDelete: rolePerm.canDelete,
        },
        update: {
          canAccess: rolePerm.canAccess,
          canCreate: rolePerm.canCreate,
          canEdit: rolePerm.canEdit,
          canDelete: rolePerm.canDelete,
        },
      });
    }
  }

  // Update department permissions
  if (departmentPermissions && Array.isArray(departmentPermissions)) {
    for (const deptPerm of departmentPermissions) {
      await prisma.department_permissions.upsert({
        where: {
          pageId_department: {
            pageId,
            department: deptPerm.department,
          },
        },
        create: {
          pageId,
          department: deptPerm.department,
          canAccess: deptPerm.canAccess,
          canCreate: deptPerm.canCreate,
          canEdit: deptPerm.canEdit,
          canDelete: deptPerm.canDelete,
        },
        update: {
          canAccess: deptPerm.canAccess,
          canCreate: deptPerm.canCreate,
          canEdit: deptPerm.canEdit,
          canDelete: deptPerm.canDelete,
        },
      });
    }
  }

  // Fetch updated permissions
  const updated = await prisma.page_permissions.findUnique({
    where: { id: pageId },
    include: {
      role_permissions: true,
      department_permissions: true,
    },
  });

  return res.status(200).json({
    message: 'Permissions updated successfully',
    page: updated,
  });
}
