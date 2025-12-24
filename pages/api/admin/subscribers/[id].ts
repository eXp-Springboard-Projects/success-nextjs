import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .select(`
          *,
          member:members(*)
        `)
        .eq('id', id as string)
        .single();

      if (error) throw error;

      if (!subscriber) {
        return res.status(404).json({ message: 'Subscriber not found' });
      }

      return res.status(200).json(subscriber);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch subscriber' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        email,
        firstName,
        lastName,
        type,
        recipientType,
        isComplimentary,
        status,
      } = req.body;

      const updateData: any = {
        email,
        firstName,
        lastName,
        type,
        recipientType,
        isComplimentary,
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'UNSUBSCRIBED') {
        updateData.unsubscribedAt = new Date().toISOString();
      }

      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .update(updateData)
        .eq('id', id as string)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(subscriber);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update subscriber' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id as string);

      if (error) throw error;

      return res.status(200).json({ message: 'Subscriber deleted' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete subscriber' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
