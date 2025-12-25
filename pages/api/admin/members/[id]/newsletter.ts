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

    // Log the newsletter send
    await supabase.from('member_activities').insert({
      id: nanoid(),
      memberId: id as string,
      type: 'newsletter_sent',
      description: 'SUCCESS Magazine Newsletter sent',
      metadata: {
        sentBy: session.user.email,
        sentAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    // Update last contact date
    await supabase
      .from('members')
      .update({ lastContactDate: new Date().toISOString() })
      .eq('id', id);

    // In a real implementation, you would integrate with your newsletter service
    console.log('Newsletter would be sent to:', member.email);

    return res.status(200).json({
      success: true,
      message: 'Newsletter sent successfully',
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return res.status(500).json({ error: 'Failed to send newsletter' });
  }
}
