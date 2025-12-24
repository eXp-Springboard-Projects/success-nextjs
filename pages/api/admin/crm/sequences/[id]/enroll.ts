import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { contactId, dealId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', id)
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Contact already enrolled in this sequence' });
    }

    const enrollmentId = nanoid();

    const { data: enrollment, error: enrollError } = await supabase
      .from('sequence_enrollments')
      .insert({
        id: enrollmentId,
        sequence_id: id,
        contact_id: contactId,
        deal_id: dealId || null,
        current_step: 0,
        status: 'active',
      })
      .select()
      .single();

    if (enrollError) {
      throw enrollError;
    }

    // Update sequence total enrolled
    const { data: sequence } = await supabase
      .from('sequences')
      .select('total_enrolled')
      .eq('id', id)
      .single();

    await supabase
      .from('sequences')
      .update({
        total_enrolled: (sequence?.total_enrolled || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.status(201).json(enrollment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to enroll contact' });
  }
}
