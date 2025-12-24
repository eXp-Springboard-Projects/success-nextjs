import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can view pending staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('role', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform to match expected format
    const transformedUsers = pendingUsers?.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at
    }));

    return res.status(200).json(transformedUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch pending users' });
  }
}
