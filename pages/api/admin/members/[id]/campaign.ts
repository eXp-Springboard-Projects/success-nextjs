import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { campaignType } = req.body;

  if (!campaignType) {
    return res.status(400).json({ error: 'Campaign type required' });
  }

  const supabase = supabaseAdmin();

  try {
    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('email, firstName, lastName')
      .eq('id', id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Add to campaign enrollment (you would create this table)
    await supabase.from('campaign_enrollments').insert({
      id: nanoid(),
      memberId: id as string,
      campaignType,
      status: 'active',
      enrolledBy: session.user.email,
      enrolledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Log the activity
    await supabase.from('member_activities').insert({
      id: nanoid(),
      memberId: id as string,
      type: 'campaign_enrolled',
      description: `Added to ${campaignType} campaign`,
      metadata: {
        campaignType,
        enrolledBy: session.user.email,
      },
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `Added to ${campaignType} campaign`,
    });
  } catch (error) {
    console.error('Error adding to campaign:', error);
    return res.status(500).json({ error: 'Failed to add to campaign' });
  }
}
