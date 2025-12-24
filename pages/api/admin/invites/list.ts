import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only ADMIN and SUPER_ADMIN can view invite codes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can view invite codes' });
    }

    const supabase = supabaseAdmin();

    const { data: invites, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      invites,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invite codes' });
  }
}
