import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getMediaItem(req, res, id);
    case 'PUT':
      return updateMediaItem(req, res, id);
    case 'DELETE':
      return deleteMediaItem(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getMediaItem(req, res, id) {
  try {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    return res.status(200).json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateMediaItem(req, res, id) {
  try {
    const { alt } = req.body;

    const media = await prisma.media.update({
      where: { id },
      data: { alt },
    });

    return res.status(200).json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteMediaItem(req, res, id) {
  try {
    // TODO: Delete actual file from storage
    await prisma.media.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
