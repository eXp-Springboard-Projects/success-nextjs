import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getVideos(req, res);
    case 'POST':
      return createVideo(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getVideos(req, res) {
  const supabase = createClient(req, res);

  try {
    const {
      per_page = 10,
      page = 1,
      _embed,
      status,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const limit = parseInt(per_page);

    const statusFilter = status && status !== 'all' ? status.toUpperCase() : 'PUBLISHED';

    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('status', statusFilter)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: videos, error, count } = await query;

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch videos' });
    }

    res.setHeader('X-WP-Total', count || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / limit));

    // Transform to WordPress-like format
    const transformedVideos = videos.map(video => ({
      id: video.id,
      date: video.published_at,
      slug: video.slug,
      title: {
        rendered: video.title,
      },
      content: {
        rendered: video.description || '',
      },
      video_url: video.video_url,
      _embedded: _embed ? {
        'wp:featuredmedia': video.thumbnail ? [{
          source_url: video.thumbnail,
        }] : [],
      } : undefined,
    }));

    return res.status(200).json(transformedVideos);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createVideo(req, res) {
  const supabase = createClient(req, res);

  try {
    const {
      title,
      slug,
      description,
      videoUrl,
      thumbnail,
      duration,
      status = 'DRAFT',
    } = req.body;

    const videoData = {
      title,
      slug,
      description,
      video_url: videoUrl,
      thumbnail,
      duration,
      status: status.toUpperCase(),
      published_at: status.toUpperCase() === 'PUBLISHED' ? new Date().toISOString() : null,
    };

    const { data: video, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to create video' });
    }

    return res.status(201).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
