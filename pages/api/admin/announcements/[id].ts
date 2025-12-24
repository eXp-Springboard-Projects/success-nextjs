import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    if (req.method === 'GET') {
      const supabase = supabaseAdmin();

      const { data: announcement, error } = await supabase
        .from('announcements')
        .select(`
          *,
          users!announcements_created_by_fkey (
            id,
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error || !announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      return res.status(200).json({
        ...announcement,
        createdBy: announcement.users?.name,
      });
    }

    if (req.method === 'PUT') {
      const supabase = supabaseAdmin();
      // Only Super Admin and Admin can update announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const {
        title,
        content,
        type,
        priority,
        targetAudience,
        isActive,
        isPinned,
        publishedAt,
        expiresAt,
        dismissible,
        linkUrl,
        linkText,
      } = req.body;

      const updates: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (type !== undefined) updates.type = type;
      if (priority !== undefined) updates.priority = priority;
      if (targetAudience !== undefined) updates.target_audience = targetAudience;
      if (isActive !== undefined) updates.is_active = isActive;
      if (isPinned !== undefined) updates.is_pinned = isPinned;
      if (publishedAt !== undefined) updates.published_at = new Date(publishedAt).toISOString();
      if (expiresAt !== undefined) updates.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;
      if (dismissible !== undefined) updates.dismissible = dismissible;
      if (linkUrl !== undefined) updates.link_url = linkUrl;
      if (linkText !== undefined) updates.link_text = linkText;

      const { data: announcement, error: updateError } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          users!announcements_created_by_fkey (
            id,
            name,
            email
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          action: 'ANNOUNCEMENT_UPDATED',
          entity: 'announcements',
          entity_id: announcement.id,
          details: `Updated announcement: "${announcement.title}"`,
          created_at: new Date().toISOString(),
        });

      return res.status(200).json({
        message: 'Announcement updated successfully',
        announcement: {
          ...announcement,
          createdBy: announcement.users?.name,
        },
      });
    }

    if (req.method === 'DELETE') {
      const supabase = supabaseAdmin();
      // Only Super Admin and Admin can delete announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { data: announcement, error: fetchError } = await supabase
        .from('announcements')
        .select('title')
        .eq('id', id)
        .single();

      if (fetchError || !announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          action: 'ANNOUNCEMENT_DELETED',
          entity: 'announcements',
          entity_id: id,
          details: `Deleted announcement: "${announcement.title}"`,
          created_at: new Date().toISOString(),
        });

      return res.status(200).json({
        message: 'Announcement deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Announcement detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
