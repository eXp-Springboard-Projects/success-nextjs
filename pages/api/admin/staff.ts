import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only SUPER_ADMIN and ADMIN can view staff
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      // Get all staff members with @success.com email
      const { data: staff, error } = await supabase
        .from('users')
        .select('id, name, email, role, emailVerified, createdAt, lastLoginAt')
        .ilike('email', '%@success.com')
        .order('name');

      if (error) {
        throw error;
      }

      // Get post counts for each staff member
      const staffWithCounts = await Promise.all(
        (staff || []).map(async (member: any) => {
          const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('authorId', member.id);

          return {
            ...member,
            postsCount: count || 0,
          };
        })
      );

      return res.status(200).json({
        success: true,
        staff: staffWithCounts,
        count: staffWithCounts.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Staff API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
