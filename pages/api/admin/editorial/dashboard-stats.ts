import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.EDITORIAL)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const supabase = supabaseAdmin();

    // Fetch dashboard stats
    const [
      publishedThisWeekResult,
      draftsResult,
      scheduledResult,
      pendingReviewResult,
      totalArticlesResult,
      totalAuthorsResult,
      recentActivityResult,
      upcomingPublicationsResult
    ] = await Promise.all([
      // Published this week
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PUBLISHED')
        .gte('published_at', oneWeekAgo.toISOString()),

      // Drafts
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DRAFT'),

      // Scheduled posts
      supabase
        .from('editorial_calendar')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SCHEDULED')
        .gte('scheduled_date', now.toISOString()),

      // Pending review (using editorial calendar status)
      supabase
        .from('editorial_calendar')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'IN_REVIEW'),

      // Total articles
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PUBLISHED'),

      // Total authors (users with AUTHOR or EDITOR role)
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['AUTHOR', 'EDITOR']),

      // Recent activity from staff activity feed
      supabase
        .from('staff_activity_feed')
        .select('*')
        .eq('department', Department.EDITORIAL)
        .order('created_at', { ascending: false })
        .limit(10),

      // Upcoming publications (next 7 days)
      supabase
        .from('editorial_calendar')
        .select(`
          *,
          users!editorial_calendar_author_id_fkey(name)
        `)
        .eq('status', 'SCHEDULED')
        .gte('scheduled_date', now.toISOString())
        .lte('scheduled_date', sevenDaysFromNow.toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(10)
    ]);

    const publishedThisWeek = publishedThisWeekResult.count || 0;
    const drafts = draftsResult.count || 0;
    const scheduled = scheduledResult.count || 0;
    const pendingReview = pendingReviewResult.count || 0;
    const totalArticles = totalArticlesResult.count || 0;
    const totalAuthors = totalAuthorsResult.count || 0;
    const recentActivity = recentActivityResult.data || [];
    const upcomingPublications = upcomingPublicationsResult.data || [];

    const stats = {
      publishedThisWeek,
      drafts,
      scheduled,
      pendingReview,
      totalArticles,
      totalAuthors,
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        type: activity.entity_type?.toLowerCase() || 'post',
        description: activity.description || activity.action,
        timestamp: activity.created_at,
        user: activity.user_name
      })),
      upcomingPublications: upcomingPublications.map((pub: any) => ({
        id: pub.id,
        title: pub.title,
        author: pub.users?.name || 'Unknown',
        scheduledDate: pub.scheduled_date || '',
        category: pub.category_id || 'Uncategorized'
      }))
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
