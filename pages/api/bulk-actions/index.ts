import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { action, entity, entityIds } = req.body;

      if (!action || !entity || !Array.isArray(entityIds) || entityIds.length === 0) {
        return res.status(400).json({ error: 'Invalid bulk action request' });
      }

      // Create bulk action record
      const bulkAction = await prisma.bulk_actions.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          action,
          entity,
          entityIds,
          totalItems: entityIds.length,
          status: 'PENDING',
        },
      });

      // Process bulk action asynchronously
      processBulkAction(bulkAction.id, action, entity, entityIds, session.user.id);

      return res.status(202).json({
        success: true,
        message: 'Bulk action queued for processing',
        bulkActionId: bulkAction.id,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create bulk action' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', perPage = '20', status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(perPage as string);

      const where: any = { userId: session.user.id };
      if (status) where.status = status;

      const [actions, total] = await Promise.all([
        prisma.bulk_actions.findMany({
          where,
          include: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: parseInt(perPage as string),
        }),
        prisma.bulk_actions.count({ where }),
      ]);

      return res.status(200).json({
        actions,
        total,
        page: parseInt(page as string),
        perPage: parseInt(perPage as string),
        totalPages: Math.ceil(total / parseInt(perPage as string)),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch bulk actions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function processBulkAction(
  bulkActionId: string,
  action: string,
  entity: string,
  entityIds: string[],
  userId: string
) {
  try {
    // Update status to processing
    await prisma.bulk_actions.update({
      where: { id: bulkActionId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    const errors: string[] = [];
    let processedCount = 0;

    // Process each entity
    for (const entityId of entityIds) {
      try {
        await processSingleEntity(action, entity, entityId);
        processedCount++;

        // Log activity
        await prisma.activity_logs.create({
          data: {
            id: randomUUID(),
            userId,
            action: action.toUpperCase(),
            entity,
            entityId,
            details: JSON.stringify({ bulkActionId }),
          },
        });

        // Update progress
        await prisma.bulk_actions.update({
          where: { id: bulkActionId },
          data: { processedItems: processedCount },
        });
      } catch (error) {
        errors.push(`${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Mark as completed
    await prisma.bulk_actions.update({
      where: { id: bulkActionId },
      data: {
        status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
        completedAt: new Date(),
        errors,
      },
    });
  } catch (error) {
    await prisma.bulk_actions.update({
      where: { id: bulkActionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
    });
  }
}

async function processSingleEntity(action: string, entity: string, entityId: string) {
  switch (entity) {
    case 'media':
      if (action === 'DELETE') {
        await prisma.media.delete({ where: { id: entityId } });
      }
      break;

    case 'bookmark':
      if (action === 'DELETE') {
        await prisma.bookmarks.delete({ where: { id: entityId } });
      }
      break;

    case 'comment':
      if (action === 'DELETE') {
        await prisma.comments.delete({ where: { id: entityId } });
      } else if (action === 'APPROVE') {
        await prisma.comments.update({
          where: { id: entityId },
          data: { status: 'APPROVED' },
        });
      } else if (action === 'SPAM') {
        await prisma.comments.update({
          where: { id: entityId },
          data: { status: 'SPAM' },
        });
      } else if (action === 'TRASH') {
        await prisma.comments.update({
          where: { id: entityId },
          data: { status: 'TRASH' },
        });
      }
      break;

    case 'user':
      if (action === 'DELETE') {
        await prisma.users.delete({ where: { id: entityId } });
      }
      break;

    case 'editorialItem':
      if (action === 'DELETE') {
        await prisma.editorial_calendar.delete({ where: { id: entityId } });
      } else if (action === 'PUBLISH') {
        await prisma.editorial_calendar.update({
          where: { id: entityId },
          data: { status: 'PUBLISHED' },
        });
      } else if (action === 'ARCHIVE') {
        await prisma.editorial_calendar.update({
          where: { id: entityId },
          data: { status: 'ARCHIVED' },
        });
      }
      break;

    default:
      throw new Error(`Unsupported entity type: ${entity}`);
  }
}
