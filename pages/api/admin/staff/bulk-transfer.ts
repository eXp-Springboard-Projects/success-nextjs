import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
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

    const supabase = supabaseAdmin();

    // Verify both users exist
    const { data: fromUser, error: fromUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', fromUserId)
      .single();

    const { data: toUser, error: toUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', toUserId)
      .single();

    if (!fromUser || fromUserError) {
      return res.status(404).json({ error: `Source user not found: ${fromUserId}` });
    }

    if (!toUser || toUserError) {
      return res.status(404).json({ error: `Destination user not found: ${toUserId}` });
    }

    const errors: string[] = [];
    let processedCount = 0;
    let totalItems = 0;

    // Create bulk action record
    const { data: bulkAction, error: bulkActionError } = await supabase
      .from('bulk_actions')
      .insert({
        id: uuidv4(),
        userId: session.user.id,
        action: `TRANSFER_${transferType}`,
        entity: 'editorial_calendar',
        entityIds: [fromUserId, toUserId],
        status: 'PROCESSING',
        totalItems: 0, // Will update after counting
        processedItems: 0,
        errors: [],
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (bulkActionError) throw new Error(bulkActionError.message);

    try {
      switch (transferType) {
        case 'ALL_CONTENT':
          // Transfer all editorial calendar items from one user to another
          const { data: allContent, error: allContentError } = await supabase
            .from('editorial_calendar')
            .select('*')
            .eq('assignedToId', fromUserId);

          if (allContentError) throw new Error(allContentError.message);

          totalItems = allContent?.length || 0;

          for (const item of allContent || []) {
            try {
              const { error: updateError } = await supabase
                .from('editorial_calendar')
                .update({ assignedToId: toUserId })
                .eq('id', item.id);

              if (updateError) throw updateError;
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring item ${item.id}: ${error.message}`);
            }
          }

          // Also transfer all posts
          const { data: allPosts, error: allPostsError } = await supabase
            .from('posts')
            .select('*')
            .eq('authorId', fromUserId);

          if (allPostsError) throw new Error(allPostsError.message);

          totalItems += allPosts?.length || 0;

          for (const post of allPosts || []) {
            try {
              const { error: updateError } = await supabase
                .from('posts')
                .update({ authorId: toUserId })
                .eq('id', post.id);

              if (updateError) throw updateError;
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
              const { data: editorialItem, error: editorialError } = await supabase
                .from('editorial_calendar')
                .select('*')
                .eq('id', contentId)
                .single();

              if (editorialItem && !editorialError) {
                if (editorialItem.assignedToId !== fromUserId) {
                  errors.push(`Item ${contentId} is not assigned to source user`);
                  continue;
                }

                const { error: updateError } = await supabase
                  .from('editorial_calendar')
                  .update({ assignedToId: toUserId })
                  .eq('id', contentId);

                if (updateError) throw updateError;
                processedCount++;
              } else {
                // Try posts
                const { data: post, error: postError } = await supabase
                  .from('posts')
                  .select('*')
                  .eq('id', contentId)
                  .single();

                if (post && !postError) {
                  if (post.authorId !== fromUserId) {
                    errors.push(`Post ${contentId} is not authored by source user`);
                    continue;
                  }

                  const { error: updateError } = await supabase
                    .from('posts')
                    .update({ authorId: toUserId })
                    .eq('id', contentId);

                  if (updateError) throw updateError;
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
          const { data: pendingEditorial, error: pendingError } = await supabase
            .from('editorial_calendar')
            .select('*')
            .eq('assignedToId', fromUserId)
            .in('status', ['IDEA', 'ASSIGNED', 'IN_PROGRESS', 'DRAFT']);

          if (pendingError) throw new Error(pendingError.message);

          totalItems = pendingEditorial?.length || 0;

          for (const item of pendingEditorial || []) {
            try {
              const { error: updateError } = await supabase
                .from('editorial_calendar')
                .update({ assignedToId: toUserId })
                .eq('id', item.id);

              if (updateError) throw updateError;
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring pending item ${item.id}: ${error.message}`);
            }
          }

          // Also transfer draft posts
          const { data: draftPosts, error: draftPostsError } = await supabase
            .from('posts')
            .select('*')
            .eq('authorId', fromUserId)
            .eq('status', 'DRAFT');

          if (draftPostsError) throw new Error(draftPostsError.message);

          totalItems += draftPosts?.length || 0;

          for (const post of draftPosts || []) {
            try {
              const { error: updateError } = await supabase
                .from('posts')
                .update({ authorId: toUserId })
                .eq('id', post.id);

              if (updateError) throw updateError;
              processedCount++;
            } catch (error: any) {
              errors.push(`Error transferring draft post ${post.id}: ${error.message}`);
            }
          }
          break;

        default:
          await supabase.from('bulk_actions').delete().eq('id', bulkAction.id);
          return res.status(400).json({ error: `Unknown transfer type: ${transferType}` });
      }

      // Log comprehensive activity
      await supabase
        .from('activity_logs')
        .insert({
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
        });

      // Update bulk action record
      await supabase
        .from('bulk_actions')
        .update({
          totalItems,
          status: errors.length > 0 && processedCount === 0 ? 'FAILED' : 'COMPLETED',
          processedItems: processedCount,
          errors,
          completedAt: new Date().toISOString(),
        })
        .eq('id', bulkAction.id);

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
      await supabase
        .from('bulk_actions')
        .update({
          status: 'FAILED',
          errors: [error.message],
          completedAt: new Date().toISOString(),
        })
        .eq('id', bulkAction.id);
      throw error;
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to perform bulk transfer' });
  }
}
