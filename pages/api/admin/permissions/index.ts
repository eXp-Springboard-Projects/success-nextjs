/**
 * API Endpoint: /api/admin/permissions
 * Manage page permissions system
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

  try {
    switch (req.method) {
      case 'GET':
        return await getAllPermissions(supabase, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getAllPermissions(supabase: any, res: NextApiResponse) {
  const { data: permissions, error } = await supabase
    .from('page_permissions')
    .select(`
      *,
      role_permissions (*),
      department_permissions (*)
    `)
    .order('category', { ascending: true })
    .order('displayName', { ascending: true });

  if (error) {
    throw error;
  }

  // Group by category
  const grouped = (permissions || []).reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return res.status(200).json({
    permissions: permissions || [],
    grouped,
  });
}
