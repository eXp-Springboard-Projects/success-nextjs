import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can reject staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const supabase = supabaseAdmin();

    // Check if user exists and is pending
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', id as string)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'PENDING') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Delete the pending user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id as string);

    if (deleteError) throw deleteError;

    // TODO: Send rejection email to user

    return res.status(200).json({ message: 'User request rejected' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject user' });
  }
}
