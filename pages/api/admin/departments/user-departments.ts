import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserDepartments } from '@/lib/auth/departmentAccess';

/**
 * GET /api/admin/departments/user-departments?userId=xxx
 * Get departments assigned to a specific user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = supabaseAdmin();
    const { userId } = req.query;

    // If no userId provided, get current user's departments
    const targetUserId = (userId as string) || session.user.id;

    // Check if user is Super Admin or requesting their own departments
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || (currentUser?.role !== 'SUPER_ADMIN' && targetUserId !== session.user.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const departments = await getUserDepartments(targetUserId);

    return res.status(200).json({ departments });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
