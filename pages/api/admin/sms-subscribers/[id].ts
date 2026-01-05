import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid subscriber ID' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'PATCH') {
    try {
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Invalid active status' });
      }

      const updateData: any = {
        active,
        updated_at: new Date().toISOString(),
      };

      // Set resubscribed_at if reactivating
      if (active) {
        updateData.resubscribed_at = new Date().toISOString();
      } else {
        // Set unsubscribed_at if deactivating
        updateData.unsubscribed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('sms_subscribers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        subscriber: data,
      });
    } catch (error: any) {
      console.error('Error updating SMS subscriber:', error);
      return res.status(500).json({ error: error.message || 'Failed to update subscriber' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('sms_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Subscriber deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting SMS subscriber:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete subscriber' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
