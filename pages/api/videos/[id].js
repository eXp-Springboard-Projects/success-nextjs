import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getVideo(req, res, id);
    case 'PUT':
      return updateVideo(req, res, id);
    case 'DELETE':
      return deleteVideo(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getVideo(req, res, id) {
  try {
    const video = await prisma.videos.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    return res.status(200).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateVideo(req, res, id) {
  try {
    const { title, slug, description, videoUrl, thumbnail, duration, status, publishedAt } = req.body;

    const video = await prisma.videos.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        videoUrl,
        thumbnail,
        duration,
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return res.status(200).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteVideo(req, res, id) {
  try {
    await prisma.videos.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
