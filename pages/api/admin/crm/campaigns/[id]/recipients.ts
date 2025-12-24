import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: recipients, error } = await supabase
      .from('email_sends')
      .select(`
        id,
        to_email,
        status,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        failed_at,
        error_message,
        contacts(first_name, last_name)
      `)
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch campaign recipients' });
    }

    // Flatten the structure to match original format
    const flattenedRecipients = recipients?.map(r => ({
      ...r,
      first_name: r.contacts?.first_name,
      last_name: r.contacts?.last_name,
      contacts: undefined,
    }));

    return res.status(200).json({ recipients: flattenedRecipients });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch campaign recipients' });
  }
}
