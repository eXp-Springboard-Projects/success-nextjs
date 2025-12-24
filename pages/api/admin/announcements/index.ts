import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const supabase = supabaseAdmin();
      const { page = '1', limit = '20', isActive, targetAudience } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      let query = supabase
        .from('announcements')
        .select(`
          *,
          users!announcements_created_by_fkey (
            id,
            name,
            email
          )
        `, { count: 'exact' });

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive === 'true');
      }

      if (targetAudience && targetAudience !== 'ALL') {
        query = query.eq('target_audience', targetAudience);
      }

      const { data: announcements, error, count: total } = await query
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .range(skip, skip + limitNum - 1);

      if (error) throw error;

      return res.status(200).json({
        announcements: (announcements || []).map(a => ({
          ...a,
          createdBy: a.users?.name,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limitNum),
        },
      });
    }

    if (req.method === 'POST') {
      const supabase = supabaseAdmin();
      // Only Super Admin and Admin can create announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const {
        title,
        content,
        type = 'INFO',
        priority = 'NORMAL',
        targetAudience = 'ALL',
        isActive = true,
        isPinned = false,
        publishedAt,
        expiresAt,
        dismissible = true,
        linkUrl,
        linkText,
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const { data: announcement, error: createError } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          type,
          priority,
          target_audience: targetAudience,
          is_active: isActive,
          is_pinned: isPinned,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          created_by: session.user.id,
          dismissible,
          link_url: linkUrl,
          link_text: linkText,
        })
        .select(`
          *,
          users!announcements_created_by_fkey (
            id,
            name,
            email
          )
        `)
        .single();

      if (createError) throw createError;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          action: 'ANNOUNCEMENT_CREATED',
          entity: 'announcements',
          entity_id: announcement.id,
          details: `Created announcement: "${title}"`,
          created_at: new Date().toISOString(),
        });

      return res.status(201).json({
        message: 'Announcement created successfully',
        announcement: {
          ...announcement,
          createdBy: announcement.users?.name,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Announcements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
