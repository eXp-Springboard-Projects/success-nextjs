import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { action } = req.body;

      let updateData: any = {};

      switch (action) {
        case 'APPROVE':
          updateData = { status: 'APPROVED' };
          break;
        case 'SPAM':
          updateData = { status: 'SPAM' };
          break;
        case 'TRASH':
          updateData = { status: 'TRASH' };
          break;
        case 'DELETE':
          const { error: deleteError } = await supabase
            .from('comments')
            .delete()
            .eq('id', id);

          if (deleteError) {
            throw deleteError;
          }

          return res.status(200).json({ success: true, message: 'Comment deleted' });
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: action.toUpperCase(),
          entity: 'comment',
          entityId: id,
          details: JSON.stringify({ commentId: id, newStatus: updateData.status }),
        });

      if (logError) {
        console.error('Failed to log activity:', logError);
      }

      return res.status(200).json(comment);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log activity
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: 'DELETE',
          entity: 'comment',
          entityId: id,
        });

      if (logError) {
        console.error('Failed to log activity:', logError);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
