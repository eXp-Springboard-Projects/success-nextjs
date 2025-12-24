import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
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

    const supabase = supabaseAdmin();

    // Create bulk action record
    const { data: bulkAction, error: bulkActionError } = await supabase
      .from('bulk_actions')
      .insert({
        id: uuidv4(),
        userId: session.user.id,
        action,
        entity: 'staff',
        entityIds: userIds,
        status: 'PROCESSING',
        totalItems: userIds.length,
        processedItems: 0,
        errors: [],
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (bulkActionError) throw new Error(bulkActionError.message);

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
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (!user || userError) {
              errors.push(`User ${userId} not found`);
              continue;
            }

            for (const contentId of contentIds) {
              const { error: updateError } = await supabase
                .from('editorial_calendar')
                .update({ assignedToId: userId })
                .eq('id', contentId);

              if (updateError) throw updateError;
            }

            // Log activity
            const { error: logError } = await supabase
              .from('activity_logs')
              .insert({
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_ASSIGN_STAFF',
                entity: 'editorial_calendar',
                entityId: userId,
                details: `Assigned staff to ${contentIds.length} content items`,
              });

            if (logError) throw logError;

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
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (!user || userError) {
              errors.push(`User ${userId} not found`);
              continue;
            }

            // Prevent removing last SUPER_ADMIN
            if (user.role === 'SUPER_ADMIN' && newRole !== 'SUPER_ADMIN') {
              const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'SUPER_ADMIN');

              if (countError) throw countError;

              if ((count || 0) <= 1) {
                errors.push(`Cannot change role of last SUPER_ADMIN: ${user.email}`);
                continue;
              }
            }

            const { error: updateError } = await supabase
              .from('users')
              .update({ role: newRole as any })
              .eq('id', userId);

            if (updateError) throw updateError;

            // Log activity
            const { error: logError } = await supabase
              .from('activity_logs')
              .insert({
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_UPDATE_ROLE',
                entity: 'users',
                entityId: userId,
                details: `Changed role from ${user.role} to ${newRole}`,
              });

            if (logError) throw logError;

            processedCount++;
          } catch (error: any) {
            errors.push(`Error updating role for user ${userId}: ${error.message}`);
          }
        }
        break;

      case 'ACTIVATE':
        for (const userId of userIds) {
          try {
            const { error: updateError } = await supabase
              .from('users')
              .update({ emailVerified: true })
              .eq('id', userId);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
              .from('activity_logs')
              .insert({
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_ACTIVATE_STAFF',
                entity: 'users',
                entityId: userId,
                details: 'Staff member activated',
              });

            if (logError) throw logError;

            processedCount++;
          } catch (error: any) {
            errors.push(`Error activating user ${userId}: ${error.message}`);
          }
        }
        break;

      case 'DEACTIVATE':
        for (const userId of userIds) {
          try {
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            // Prevent deactivating SUPER_ADMIN
            if (user?.role === 'SUPER_ADMIN') {
              errors.push(`Cannot deactivate SUPER_ADMIN: ${user.email}`);
              continue;
            }

            const { error: updateError } = await supabase
              .from('users')
              .update({ emailVerified: false })
              .eq('id', userId);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
              .from('activity_logs')
              .insert({
                id: uuidv4(),
                userId: session.user.id,
                action: 'BULK_DEACTIVATE_STAFF',
                entity: 'users',
                entityId: userId,
                details: 'Staff member deactivated',
              });

            if (logError) throw logError;

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
    const { error: updateBulkError } = await supabase
      .from('bulk_actions')
      .update({
        status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
        processedItems: processedCount,
        errors,
        completedAt: new Date().toISOString(),
      })
      .eq('id', bulkAction.id);

    if (updateBulkError) throw new Error(updateBulkError.message);

    return res.status(200).json({
      success: true,
      bulkActionId: bulkAction.id,
      processedItems: processedCount,
      totalItems: userIds.length,
      errors,
      status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to perform bulk operation' });
  }
}
