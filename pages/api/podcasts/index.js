import { prisma } from '../../../lib/prisma';

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
  try {
    const {
      per_page = 10,
      page = 1,
      _embed,
      status,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const take = parseInt(per_page);

    const where = status && status !== 'all' ? { status: status.toUpperCase() } : { status: 'PUBLISHED' };

    const podcasts = await prisma.podcasts.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
    });

    const total = await prisma.podcasts.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    // Transform to WordPress-like format
    const transformedPodcasts = podcasts.map(podcast => ({
      id: podcast.id,
      date: podcast.publishedAt,
      slug: podcast.slug,
      title: {
        rendered: podcast.title,
      },
      content: {
        rendered: podcast.description || '',
      },
      audio_url: podcast.audioUrl,
      _embedded: _embed ? {
        'wp:featuredmedia': podcast.thumbnail ? [{
          source_url: podcast.thumbnail,
        }] : [],
      } : undefined,
    }));

    return res.status(200).json(transformedPodcasts);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPodcast(req, res) {
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

    const podcast = await prisma.podcasts.create({
      data: {
        title,
        slug,
        description,
        audioUrl,
        thumbnail,
        duration,
        status: status.toUpperCase(),
        publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null,
      },
    });

    return res.status(201).json(podcast);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
