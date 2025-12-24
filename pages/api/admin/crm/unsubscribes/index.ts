import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      // Fetch email preferences with unsubscribed status and join with contacts
      const { data: unsubscribes, error } = await supabase
        .from('email_preferences')
        .select(`
          id,
          email,
          unsubscribed_at,
          unsubscribe_reason,
          opt_in_marketing,
          opt_in_newsletter,
          opt_in_transactional,
          contacts (
            first_name,
            last_name
          )
        `)
        .eq('unsubscribed', true)
        .order('unsubscribed_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format the response
      const formatted = unsubscribes?.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.contacts?.first_name || null,
        lastName: u.contacts?.last_name || null,
        unsubscribedAt: u.unsubscribed_at,
        unsubscribeReason: u.unsubscribe_reason,
        optInMarketing: u.opt_in_marketing,
        optInNewsletter: u.opt_in_newsletter,
        optInTransactional: u.opt_in_transactional,
      })) || [];

      return res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching unsubscribes:', error);
      return res.status(500).json({ error: 'Failed to fetch unsubscribes' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
