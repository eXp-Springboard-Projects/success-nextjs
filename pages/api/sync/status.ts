import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

// Get recent sync logs and status
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = supabaseAdmin();

    // Get recent sync logs
    const { data: syncLogs, error: logsError } = await supabase
      .from('activity_logs')
      .select(`
        *,
        users(
          id,
          name,
          email
        )
      `)
      .eq('action', 'WORDPRESS_SYNC')
      .order('createdAt', { ascending: false })
      .limit(20);

    if (logsError) throw logsError;

    // Parse details JSON
    const formattedLogs = syncLogs?.map((log: any) => ({
      id: log.id,
      user: log.users,
      entity: log.entity,
      timestamp: log.createdAt,
      details: log.details ? JSON.parse(log.details) : null,
    })) || [];

    // Get current database stats
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { count: tagsCount } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true });

    const { count: authorsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'AUTHOR');

    const stats = {
      posts: postsCount || 0,
      categories: categoriesCount || 0,
      tags: tagsCount || 0,
      users: authorsCount || 0,
    };

    return res.status(200).json({
      logs: formattedLogs,
      stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch sync status',
      message: error.message,
    });
  }
}
