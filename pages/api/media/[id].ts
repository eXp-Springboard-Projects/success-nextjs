import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const media = await prisma.media.findUnique({
        where: { id: id as string }
      });

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      return res.status(200).json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if media exists
      const media = await prisma.media.findUnique({
        where: { id: id as string }
      });

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Delete from database
      await prisma.media.delete({
        where: { id: id as string }
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          action: 'DELETE',
          entity: 'media',
          entityId: id as string,
          details: JSON.stringify({
            filename: media.filename,
          }),
        },
      });

      return res.status(200).json({ success: true, message: 'Media deleted' });
    } catch (error) {
      console.error('Error deleting media:', error);
      return res.status(500).json({ error: 'Failed to delete media' });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const { alt, caption } = req.body;

      const updatedMedia = await prisma.media.update({
        where: { id: id as string },
        data: {
          alt: alt || undefined,
          caption: caption || undefined,
        },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          action: 'UPDATE',
          entity: 'media',
          entityId: id as string,
          details: JSON.stringify({
            alt,
            caption,
          }),
        },
      });

      return res.status(200).json({
        success: true,
        media: updatedMedia,
      });
    } catch (error) {
      console.error('Error updating media:', error);
      return res.status(500).json({ error: 'Failed to update media' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
