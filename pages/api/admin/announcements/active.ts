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
      const now = new Date().toISOString();

      // Build target audience filter
      const targetAudiences = ['ALL'];
      if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' ||
          session.user.role === 'EDITOR' || session.user.role === 'AUTHOR') {
        targetAudiences.push('STAFF');
      }
      if ((session.user as any).memberId) {
        targetAudiences.push('MEMBERS');
      }

      // Get active announcements
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select(`
          *,
          announcement_views!left (
            viewed_at,
            dismissed_at
          )
        `)
        .eq('is_active', true)
        .lte('published_at', now)
        .in('target_audience', targetAudiences)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_pinned', { ascending: false })
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Filter announcements by user's view status
      const { data: views } = await supabase
        .from('announcement_views')
        .select('announcement_id, viewed_at, dismissed_at')
        .eq('user_id', session.user.id);

      const viewsMap = new Map(
        (views || []).map(v => [v.announcement_id, v])
      );

      // Filter out dismissed announcements (if they're dismissible)
      const activeAnnouncements = (announcements || []).filter(a => {
        if (!a.dismissible) return true; // Non-dismissible always show
        const view = viewsMap.get(a.id);
        return !view || !view.dismissed_at; // Show if not dismissed
      });

      return res.status(200).json({
        announcements: activeAnnouncements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          dismissible: a.dismissible,
          isPinned: a.is_pinned,
          linkUrl: a.link_url,
          linkText: a.link_text,
          publishedAt: a.published_at,
          expiresAt: a.expires_at,
        })),
      });
    }

    if (req.method === 'POST') {
      const supabase = supabaseAdmin();
      // Mark announcement as viewed or dismissed
      const { announcementId, action } = req.body;

      if (!announcementId || !action) {
        return res.status(400).json({ error: 'announcementId and action are required' });
      }

      if (action !== 'view' && action !== 'dismiss') {
        return res.status(400).json({ error: 'action must be either "view" or "dismiss"' });
      }

      // Check if view record exists
      const { data: existing } = await supabase
        .from('announcement_views')
        .select('*')
        .eq('announcement_id', announcementId)
        .eq('user_id', session.user.id)
        .single();

      let view;
      if (existing) {
        // Update existing view
        const updates: any = {};
        if (action === 'dismiss') {
          updates.dismissed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('announcement_views')
          .update(updates)
          .eq('announcement_id', announcementId)
          .eq('user_id', session.user.id)
          .select()
          .single();

        if (error) throw error;
        view = data;
      } else {
        // Create new view
        const { data, error } = await supabase
          .from('announcement_views')
          .insert({
            announcement_id: announcementId,
            user_id: session.user.id,
            viewed_at: new Date().toISOString(),
            ...(action === 'dismiss' && { dismissed_at: new Date().toISOString() }),
          })
          .select()
          .single();

        if (error) throw error;
        view = data;
      }

      return res.status(200).json({
        message: `Announcement ${action}ed successfully`,
        view,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Active announcements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
