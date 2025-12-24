import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getPodcasts(req, res);
    case 'POST':
      return createPodcast(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPodcasts(req, res) {
  const supabase = supabaseAdmin();

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
      .from('podcasts')
      .select('*', { count: 'exact' })
      .eq('status', statusFilter)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: podcasts, error, count } = await query;

    if (error) {
      console.error('Error fetching podcasts:', error);
      return res.status(500).json({ message: 'Failed to fetch podcasts' });
    }

    res.setHeader('X-WP-Total', count || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / limit));

    // Transform to WordPress-like format
    const transformedPodcasts = (podcasts || []).map(podcast => ({
      id: podcast.id,
      date: podcast.published_at,
      slug: podcast.slug,
      title: {
        rendered: podcast.title,
      },
      content: {
        rendered: podcast.description || '',
      },
      audio_url: podcast.audio_url,
      _embedded: _embed ? {
        'wp:featuredmedia': podcast.thumbnail ? [{
          source_url: podcast.thumbnail,
        }] : [],
      } : undefined,
    }));

    return res.status(200).json(transformedPodcasts);
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPodcast(req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      title,
      slug,
      description,
      audioUrl,
      thumbnail,
      duration,
      status = 'DRAFT',
    } = req.body;

    const podcastData = {
      title,
      slug,
      description,
      audio_url: audioUrl,
      thumbnail,
      duration,
      status: status.toUpperCase(),
      published_at: status.toUpperCase() === 'PUBLISHED' ? new Date().toISOString() : null,
    };

    const { data: podcast, error } = await supabase
      .from('podcasts')
      .insert([podcastData])
      .select()
      .single();

    if (error) {
      console.error('Error creating podcast:', error);
      return res.status(500).json({ message: 'Failed to create podcast' });
    }

    return res.status(201).json(podcast);
  } catch (error) {
    console.error('Error creating podcast:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
