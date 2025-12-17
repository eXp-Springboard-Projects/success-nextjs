import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulk assign staff members to content/roles
 * POST /api/admin/staff/bulk-assign
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

    // Only SUPER_ADMIN and ADMIN can perform bulk operations
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userIds, action, contentIds, newRole } = req.body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    // Create bulk action record
    const bulkAction = await prisma.bulk_actions.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        action,
        entity: 'staff',
        entityIds: userIds,
        status: 'PROCESSING',
        totalItems: userIds.length,
        processedItems: 0,
        errors: [],
        startedAt: new Date(),
      },
    });

    const errors: string[] = [];
    let processedCount = 0;

    // Process based on action type
    switch (action) {
      case 'ASSIGN_TO_CONTENT':
        if (!contentIds || !Array.isArray(contentIds)) {
          return res.status(400).json({ error: 'contentIds array is required for ASSIGN_TO_CONTENT action' });
        }

        // Assign multiple staff to multiple content items
        for (const userId of userIds) {
          try {
            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
              errors.push(`User ${userId} not found`);
              continue;
            }

            for (const contentId of contentIds) {
              await prisma.editorial_calendar.update({
                where: { id: contentId },
                data: { assignedToId: userId },
              });
            }

            // Log activity
            await prisma.activity_logs.create({
              data: {
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_ASSIGN_STAFF',
                entity: 'editorial_calendar',
                entityId: userId,
                details: `Assigned staff to ${contentIds.length} content items`,
              },
            });

            processedCount++;
          } catch (error: any) {
            errors.push(`Error assigning user ${userId}: ${error.message}`);
          }
        }
        break;

      case 'UPDATE_ROLE':
        if (!newRole) {
          return res.status(400).json({ error: 'newRole is required for UPDATE_ROLE action' });
        }

        const validRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'];
        if (!validRoles.includes(newRole)) {
          return res.status(400).json({ error: 'Invalid role' });
        }

        // Only SUPER_ADMIN can create other SUPER_ADMINs
        if (newRole === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
          return res.status(403).json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' });
        }

        for (const userId of userIds) {
          try {
            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
              errors.push(`User ${userId} not found`);
              continue;
            }

            // Prevent removing last SUPER_ADMIN
            if (user.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
              const superAdminCount = await prisma.users.count({
                where: { role: 'SUPER_ADMIN' },
              });

              if (superAdminCount <= 1) {
                errors.push(`Cannot change role of last SUPER_ADMIN: ${user.email}`);
                continue;
              }
            }

            await prisma.users.update({
              where: { id: userId },
              data: { role: newRole as any },
            });

            // Log activity
            await prisma.activity_logs.create({
              data: {
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_UPDATE_ROLE',
                entity: 'users',
                entityId: userId,
                details: `Changed role from ${user.role} to ${newRole}`,
              },
            });

            processedCount++;
          } catch (error: any) {
            errors.push(`Error updating role for user ${userId}: ${error.message}`);
          }
        }
        break;

      case 'ACTIVATE':
        for (const userId of userIds) {
          try {
            await prisma.users.update({
              where: { id: userId },
              data: { emailVerified: true },
            });

            await prisma.activity_logs.create({
              data: {
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_ACTIVATE_STAFF',
                entity: 'users',
                entityId: userId,
                details: 'Staff member activated',
              },
            });

            processedCount++;
          } catch (error: any) {
            errors.push(`Error activating user ${userId}: ${error.message}`);
          }
        }
        break;

      case 'DEACTIVATE':
        for (const userId of userIds) {
          try {
            const user = await prisma.users.findUnique({ where: { id: userId } });

            // Prevent deactivating SUPER_ADMIN
            if (user?.role === 'SUPER_ADMIN') {
              errors.push(`Cannot deactivate SUPER_ADMIN: ${user.email}`);
              continue;
            }

            await prisma.users.update({
              where: { id: userId },
              data: { emailVerified: false },
            });

            await prisma.activity_logs.create({
              data: {
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_DEACTIVATE_STAFF',
                entity: 'users',
                entityId: userId,
                details: 'Staff member deactivated',
              },
            });

            processedCount++;
          } catch (error: any) {
            errors.push(`Error deactivating user ${userId}: ${error.message}`);
          }
        }
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // Update bulk action record
    await prisma.bulk_actions.update({
      where: { id: bulkAction.id },
      data: {
        status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
        processedItems: processedCount,
        errors,
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      bulkActionId: bulkAction.id,
      processedItems: processedCount,
      totalItems: userIds.length,
      errors,
      status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
    });
  } catch (error: any) {
    console.error('Bulk assign staff error:', error);
    return res.status(500).json({ error: error.message || 'Failed to perform bulk operation' });
  }
}
