/**
 * API Endpoint: /api/admin/audit-user
 * Method: POST
 * Description: Audit a user's activity (SUPER_ADMIN only)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can audit users
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const supabase = supabaseAdmin();

    // 1. Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError) {
      return res.status(500).json({ error: 'Database error', details: userError.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    const audit: any = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        emailVerified: user.emailVerified,
      },
      posts: [],
      pages: [],
      media: [],
      activities: [],
      adminActions: [],
      departments: [],
    };

    // 2. Check for posts created or edited
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, slug, status, createdAt, updatedAt')
      .eq('authorId', userId);

    audit.posts = posts || [];

    // 3. Check for pages created or edited
    const { data: pages } = await supabase
      .from('pages')
      .select('id, title, slug, status, createdAt, updatedAt')
      .eq('authorId', userId);

    audit.pages = pages || [];

    // 4. Check for media uploads
    const { data: media } = await supabase
      .from('media')
      .select('id, filename, url, mimeType, size, createdAt')
      .eq('uploadedBy', userId);

    audit.media = media || [];

    // 5. Check activity log
    const { data: activities } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(100);

    audit.activities = activities || [];

    // 6. Check for admin actions
    const { data: adminActions } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    audit.adminActions = adminActions || [];

    // 7. Check for staff departments
    const { data: departments } = await supabase
      .from('staff_departments')
      .select('*')
      .eq('userId', userId);

    audit.departments = departments || [];

    // Generate summary
    const summary = {
      hasChanges:
        audit.posts.length > 0 ||
        audit.pages.length > 0 ||
        audit.media.length > 0 ||
        audit.adminActions.length > 0,
      postsCount: audit.posts.length,
      pagesCount: audit.pages.length,
      mediaCount: audit.media.length,
      activitiesCount: audit.activities.length,
      adminActionsCount: audit.adminActions.length,
      departmentsCount: audit.departments.length,
    };

    return res.status(200).json({
      success: true,
      audit,
      summary,
      recommendation: summary.hasChanges
        ? 'REVIEW REQUIRED: User has made changes to the site'
        : 'SAFE TO DELETE: No content or changes detected',
    });

  } catch (error: any) {
    console.error('Audit error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
