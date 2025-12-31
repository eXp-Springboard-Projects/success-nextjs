import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email?.endsWith('@success.com')) {
    return res.status(401).json({ error: 'Unauthorized - Staff access only' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { membershipTier, membershipStatus, trialEndsAt } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  const supabase = supabaseAdmin();

  try {
    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (membershipTier) {
      updateData.membershipTier = membershipTier;
    }

    if (membershipStatus) {
      updateData.membershipStatus = membershipStatus;
    }

    // Handle expiration date - can be set or cleared
    if (trialEndsAt === null || trialEndsAt === '') {
      updateData.trialEndsAt = null;
    } else if (trialEndsAt) {
      updateData.trialEndsAt = new Date(trialEndsAt).toISOString();
    }

    // Update member
    const { data: member, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return res.status(500).json({ error: 'Failed to update member subscription' });
    }

    return res.status(200).json({
      success: true,
      member,
      message: 'Subscription updated successfully'
    });
  } catch (error: any) {
    console.error('Error in subscription update API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
