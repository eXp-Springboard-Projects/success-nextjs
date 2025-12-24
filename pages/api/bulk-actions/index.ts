import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'POST') {
    try {
      const { action, entity, entityIds } = req.body;

      if (!action || !entity || !Array.isArray(entityIds) || entityIds.length === 0) {
        return res.status(400).json({ error: 'Invalid bulk action request' });
      }

      // Create bulk action record
      const { data: bulkAction, error: bulkActionError } = await supabase
        .from('bulk_actions')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action,
          entity,
          entityIds,
          totalItems: entityIds.length,
          status: 'PENDING',
        })
        .select()
        .single();

      if (bulkActionError) throw bulkActionError;

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
      const pageNum = parseInt(page as string);
      const perPageNum = parseInt(perPage as string);
      const skip = (pageNum - 1) * perPageNum;

      // Build query
      let query = supabase
        .from('bulk_actions')
        .select(`
          *,
          users!bulk_actions_userId_fkey(
            name,
            email
          )
        `, { count: 'exact' })
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false })
        .range(skip, skip + perPageNum - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: actions, error: actionsError, count: total } = await query;

      if (actionsError) throw actionsError;

      return res.status(200).json({
        actions: actions || [],
        total: total || 0,
        page: pageNum,
        perPage: perPageNum,
        totalPages: Math.ceil((total || 0) / perPageNum),
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
  const supabase = supabaseAdmin();

  try {
    // Update status to processing
    await supabase
      .from('bulk_actions')
      .update({
        status: 'PROCESSING',
        startedAt: new Date().toISOString(),
      })
      .eq('id', bulkActionId);

    const errors: string[] = [];
    let processedCount = 0;

    // Process each entity
    for (const entityId of entityIds) {
      try {
        await processSingleEntity(action, entity, entityId);
        processedCount++;

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            id: randomUUID(),
            userId,
            action: action.toUpperCase(),
            entity,
            entityId,
            details: JSON.stringify({ bulkActionId }),
          });

        // Update progress
        await supabase
          .from('bulk_actions')
          .update({ processedItems: processedCount })
          .eq('id', bulkActionId);
      } catch (error) {
        errors.push(`${entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Mark as completed
    await supabase
      .from('bulk_actions')
      .update({
        status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
        completedAt: new Date().toISOString(),
        errors,
      })
      .eq('id', bulkActionId);
  } catch (error) {
    await supabase
      .from('bulk_actions')
      .update({
        status: 'FAILED',
        completedAt: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      })
      .eq('id', bulkActionId);
  }
}

async function processSingleEntity(action: string, entity: string, entityId: string) {
  const supabase = supabaseAdmin();

  switch (entity) {
    case 'media':
      if (action === 'DELETE') {
        const { error } = await supabase.from('media').delete().eq('id', entityId);
        if (error) throw error;
      }
      break;

    case 'bookmark':
      if (action === 'DELETE') {
        const { error } = await supabase.from('bookmarks').delete().eq('id', entityId);
        if (error) throw error;
      }
      break;

    case 'comment':
      if (action === 'DELETE') {
        const { error } = await supabase.from('comments').delete().eq('id', entityId);
        if (error) throw error;
      } else if (action === 'APPROVE') {
        const { error } = await supabase
          .from('comments')
          .update({ status: 'APPROVED' })
          .eq('id', entityId);
        if (error) throw error;
      } else if (action === 'SPAM') {
        const { error } = await supabase
          .from('comments')
          .update({ status: 'SPAM' })
          .eq('id', entityId);
        if (error) throw error;
      } else if (action === 'TRASH') {
        const { error } = await supabase
          .from('comments')
          .update({ status: 'TRASH' })
          .eq('id', entityId);
        if (error) throw error;
      }
      break;

    case 'user':
      if (action === 'DELETE') {
        const { error } = await supabase.from('users').delete().eq('id', entityId);
        if (error) throw error;
      }
      break;

    case 'editorialItem':
      if (action === 'DELETE') {
        const { error } = await supabase.from('editorial_calendar').delete().eq('id', entityId);
        if (error) throw error;
      } else if (action === 'PUBLISH') {
        const { error } = await supabase
          .from('editorial_calendar')
          .update({ status: 'PUBLISHED' })
          .eq('id', entityId);
        if (error) throw error;
      } else if (action === 'ARCHIVE') {
        const { error } = await supabase
          .from('editorial_calendar')
          .update({ status: 'ARCHIVED' })
          .eq('id', entityId);
        if (error) throw error;
      }
      break;

    default:
      throw new Error(`Unsupported entity type: ${entity}`);
  }
}
