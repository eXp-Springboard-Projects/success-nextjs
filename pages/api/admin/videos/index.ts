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

  if (req.method === 'GET') {
    try {
      const {
        per_page = '20',
        page = '1',
        status = 'all',
        search,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(per_page as string);
      const take = parseInt(per_page as string);

      // Build query
      let query = supabase
        .from('videos')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status.toString().toUpperCase());
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: videos, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(skip, skip + take - 1);

      if (error) {
        throw error;
      }

      res.setHeader('X-Total-Count', (count || 0).toString());
      res.setHeader('X-Total-Pages', Math.ceil((count || 0) / take).toString());

      return res.status(200).json(videos || []);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        slug,
        description,
        videoUrl,
        duration,
        thumbnail,
        status = 'DRAFT',
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
      } = req.body;

      if (!title || !slug || !videoUrl) {
        return res.status(400).json({ error: 'Title, slug, and videoUrl are required' });
      }

      // Check for duplicate slug
      const { data: existing } = await supabase
        .from('videos')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Video with this slug already exists' });
      }

      const { data: video, error } = await supabase
        .from('videos')
        .insert({
          id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          slug,
          description: description || null,
          videoUrl,
          duration: duration || null,
          thumbnail: thumbnail || null,
          status: status.toUpperCase(),
          publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date().toISOString() : null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
        })
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
          action: 'CREATE',
          entity: 'video',
          entityId: video.id,
          details: JSON.stringify({ title: video.title, slug: video.slug }),
        });

      return res.status(201).json(video);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
