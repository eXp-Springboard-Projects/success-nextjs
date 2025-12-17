import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulk transfer staff teams or reassign content
 * POST /api/admin/staff/bulk-transfer
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only SUPER_ADMIN and ADMIN can perform bulk transfers
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { fromUserId, toUserId, transferType, contentIds } = req.body;

    // Validate input
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'fromUserId and toUserId are required' });
    }

    if (!transferType) {
      return res.status(400).json({ error: 'transferType is required (ALL_CONTENT, SELECTED_CONTENT, or PENDING_ONLY)' });
    }

    // Verify both users exist
    const fromUser = await prisma.users.findUnique({ where: { id: fromUserId } });
    const toUser = await prisma.users.findUnique({ where: { id: toUserId } });

    if (!fromUser) {
      return res.status(404).json({ error: `Source user not found: ${fromUserId}` });
    }

    if (!toUser) {
      return res.status(404).json({ error: `Destination user not found: ${toUserId}` });
    }

    const errors: string[] = [];
    let processedCount = 0;
    let totalItems = 0;

    // Create bulk action record
    const bulkAction = await prisma.bulk_actions.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        action: `TRANSFER_${transferType}`,
        entity: 'editorial_calendar',
        entityIds: [fromUserId, toUserId],
        status: 'PROCESSING',
        totalItems: 0, // Will update after counting
        processedItems: 0,
        errors: [],
        startedAt: new Date(),
      },
    });

    try {
      switch (transferType) {
        case 'ALL_CONTENT':
          // Transfer all editorial calendar items from one user to another
          const allContent = await prisma.editorial_calendar.findMany({
            where: { assignedToId: fromUserId },
          });

          totalItems = allContent.length;

          for (const item of allContent) {
            try {
              await prisma.editorial_calendar.update({
                where: { id: item.id },
                data: { assignedToId: toUserId },
              });
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring item ${item.id}: ${error.message}`);
            }
          }

          // Also transfer all posts
          const allPosts = await prisma.posts.findMany({
            where: { authorId: fromUserId },
          });

          totalItems += allPosts.length;

          for (const post of allPosts) {
            try {
              await prisma.posts.update({
                where: { id: post.id },
                data: { authorId: toUserId },
              });
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring post ${post.id}: ${error.message}`);
            }
          }
          break;

        case 'SELECTED_CONTENT':
          if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({ error: 'contentIds array is required for SELECTED_CONTENT transfer' });
          }

          totalItems = contentIds.length;

          for (const contentId of contentIds) {
            try {
              // Try editorial calendar first
              const editorialItem = await prisma.editorial_calendar.findUnique({
                where: { id: contentId },
              });

              if (editorialItem) {
                if (editorialItem.assignedToId !== fromUserId) {
                  errors.push(`Item ${contentId} is not assigned to source user`);
                  continue;
                }

                await prisma.editorial_calendar.update({
                  where: { id: contentId },
                  data: { assignedToId: toUserId },
                });
                processedCount++;
              } else {
                // Try posts
                const post = await prisma.posts.findUnique({
                  where: { id: contentId },
                });

                if (post) {
                  if (post.authorId !== fromUserId) {
                    errors.push(`Post ${contentId} is not authored by source user`);
                    continue;
                  }

                  await prisma.posts.update({
                    where: { id: contentId },
                    data: { authorId: toUserId },
                  });
                  processedCount++;
                } else {
                  errors.push(`Content item ${contentId} not found`);
                }
              }
            } catch (error: any) {
              errors.push(`Error transferring item ${contentId}: ${error.message}`);
            }
          }
          break;

        case 'PENDING_ONLY':
          // Transfer only pending/draft content
          const pendingEditorial = await prisma.editorial_calendar.findMany({
            where: {
              assignedToId: fromUserId,
              status: {
                in: ['IDEA', 'ASSIGNED', 'IN_PROGRESS', 'DRAFT'],
              },
            },
          });

          totalItems = pendingEditorial.length;

          for (const item of pendingEditorial) {
            try {
              await prisma.editorial_calendar.update({
                where: { id: item.id },
                data: { assignedToId: toUserId },
              });
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring pending item ${item.id}: ${error.message}`);
            }
          }

          // Also transfer draft posts
          const draftPosts = await prisma.posts.findMany({
            where: {
              authorId: fromUserId,
              status: 'DRAFT',
            },
          });

          totalItems += draftPosts.length;

          for (const post of draftPosts) {
            try {
              await prisma.posts.update({
                where: { id: post.id },
                data: { authorId: toUserId },
              });
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring draft post ${post.id}: ${error.message}`);
            }
          }
          break;

        default:
          await prisma.bulk_actions.delete({ where: { id: bulkAction.id } });
          return res.status(400).json({ error: `Unknown transfer type: ${transferType}` });
      }

      // Log comprehensive activity
      await prisma.activity_logs.create({
        data: {
          id: uuidv4(),
          userId: session.user.id,
          action: 'BULK_TRANSFER',
          entity: 'editorial_calendar',
          details: JSON.stringify({
            transferType,
            fromUser: fromUser.email,
            toUser: toUser.email,
            totalItems,
            processedItems: processedCount,
            errors: errors.length,
          }),
        },
      });

      // Update bulk action record
      await prisma.bulk_actions.update({
        where: { id: bulkAction.id },
        data: {
          totalItems,
          status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
          processedItems: processedCount,
          errors,
          completedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        bulkActionId: bulkAction.id,
        fromUser: { id: fromUser.id, email: fromUser.email, name: fromUser.name },
        toUser: { id: toUser.id, email: toUser.email, name: toUser.name },
        transferType,
        processedItems: processedCount,
        totalItems,
        errors,
        status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
      });
    } catch (error: any) {
      // Update bulk action as failed
      await prisma.bulk_actions.update({
        where: { id: bulkAction.id },
        data: {
          status: 'FAILED',
          errors: [error.message],
          completedAt: new Date(),
        },
      });
      throw error;
    }
  } catch (error: any) {
    console.error('Bulk transfer error:', error);
    return res.status(500).json({ error: error.message || 'Failed to perform bulk transfer' });
  }
}
