import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'POST') {
    try {
      const supabase = supabaseAdmin();

      // Update email preferences to resubscribe
      const { error } = await supabase
        .from('email_preferences')
        .update({
          unsubscribed: false,
          opt_in_marketing: true,
          opt_in_newsletter: true,
          opt_in_transactional: true,
          unsubscribed_at: null,
          unsubscribe_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error resubscribing:', error);
      return res.status(500).json({ error: 'Failed to resubscribe' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
