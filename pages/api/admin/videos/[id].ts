import { NextApiRequest, NextApiResponse } from 'next';
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

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: video, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      return res.status(200).json(video);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        title,
        slug,
        description,
        videoUrl,
        duration,
        thumbnail,
        status,
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
      } = req.body;

      // Check if slug is being changed and if it conflicts
      if (slug) {
        const { data: existing } = await supabase
          .from('videos')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single();

        if (existing) {
          return res.status(409).json({ error: 'Video with this slug already exists' });
        }
      }

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (duration !== undefined) updateData.duration = duration;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (status !== undefined) {
        updateData.status = status.toUpperCase();
        if (status.toUpperCase() === 'PUBLISHED') {
          updateData.publishedAt = new Date().toISOString();
        }
      }
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;

      const { data: video, error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'UPDATE',
          entity: 'video',
          entityId: video.id,
          details: JSON.stringify({ title: video.title, slug: video.slug }),
        });

      return res.status(200).json(video);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'DELETE',
          entity: 'video',
          entityId: id,
        });

      return res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
