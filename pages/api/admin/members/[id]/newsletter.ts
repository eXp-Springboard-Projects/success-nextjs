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
  const supabase = supabaseAdmin();

  try {
    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('email, firstName, lastName')
      .eq('id', id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Add member to newsletter list
    await supabase.from('newsletter_subscribers').insert({
      id: nanoid(),
      memberId: id as string,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      status: 'subscribed',
      source: 'admin_add',
      subscribedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Log the newsletter subscription
    await supabase.from('member_activities').insert({
      id: nanoid(),
      memberId: id as string,
      type: 'newsletter_subscribed',
      description: 'Added to SUCCESS Magazine Newsletter list',
      metadata: {
        addedBy: session.user.email,
        addedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Added to newsletter list successfully',
    });
  } catch (error) {
    console.error('Error adding to newsletter:', error);
    return res.status(500).json({ error: 'Failed to add to newsletter list' });
  }
}
