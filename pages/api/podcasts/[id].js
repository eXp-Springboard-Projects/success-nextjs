import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getPodcast(req, res, id);
    case 'PUT':
      return updatePodcast(req, res, id);
    case 'DELETE':
      return deletePodcast(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPodcast(req, res, id) {
  try {
    const podcast = await prisma.podcasts.findUnique({
      where: { id },
    });

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    return res.status(200).json(podcast);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePodcast(req, res, id) {
  try {
    const { title, slug, description, audioUrl, thumbnail, duration, status, publishedAt } = req.body;

    const podcast = await prisma.podcasts.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        audioUrl,
        thumbnail,
        duration,
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return res.status(200).json(podcast);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deletePodcast(req, res, id) {
  try {
    await prisma.podcasts.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
