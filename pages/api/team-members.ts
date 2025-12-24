import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('id, name, title, bio, image, linkedIn, displayOrder')
      .eq('isActive', true)
      .order('displayOrder', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json(teamMembers || []);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
}
