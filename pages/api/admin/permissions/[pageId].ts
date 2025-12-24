/**
 * API Endpoint: /api/admin/permissions/[pageId]
 * Update permissions for a specific page
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

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
        return await updatePermissions(supabase, pageId, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function updatePermissions(
  supabase: any,
  pageId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { rolePermissions, departmentPermissions } = req.body;

  // Verify page exists
  const { data: page, error: pageError } = await supabase
    .from('page_permissions')
    .select('id')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  // Update role permissions
  if (rolePermissions && Array.isArray(rolePermissions)) {
    for (const rolePerm of rolePermissions) {
      await supabase
        .from('role_permissions')
        .upsert({
          pageId,
          role: rolePerm.role,
          canAccess: rolePerm.canAccess,
          canCreate: rolePerm.canCreate,
          canEdit: rolePerm.canEdit,
          canDelete: rolePerm.canDelete,
        }, {
          onConflict: 'pageId,role'
        });
    }
  }

  // Update department permissions
  if (departmentPermissions && Array.isArray(departmentPermissions)) {
    for (const deptPerm of departmentPermissions) {
      await supabase
        .from('department_permissions')
        .upsert({
          pageId,
          department: deptPerm.department,
          canAccess: deptPerm.canAccess,
          canCreate: deptPerm.canCreate,
          canEdit: deptPerm.canEdit,
          canDelete: deptPerm.canDelete,
        }, {
          onConflict: 'pageId,department'
        });
    }
  }

  // Fetch updated permissions
  const { data: updated, error: fetchError } = await supabase
    .from('page_permissions')
    .select(`
      *,
      role_permissions (*),
      department_permissions (*)
    `)
    .eq('id', pageId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return res.status(200).json({
    message: 'Permissions updated successfully',
    page: updated,
  });
}
