import { prisma } from '../../../lib/prisma';

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

    const videos = await prisma.videos.findMany({
      where,
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
    });

    const total = await prisma.videos.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    // Transform to WordPress-like format
    const transformedVideos = videos.map(video => ({
      id: video.id,
      date: video.publishedAt,
      slug: video.slug,
      title: {
        rendered: video.title,
      },
      content: {
        rendered: video.description || '',
      },
      video_url: video.videoUrl,
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

    const video = await prisma.videos.create({
      data: {
        title,
        slug,
        description,
        videoUrl,
        thumbnail,
        duration,
        status: status.toUpperCase(),
        publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null,
      },
    });

    return res.status(201).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
