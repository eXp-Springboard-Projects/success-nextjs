import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { token, optInMarketing, optInTransactional, reason } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find email by token
    const { data: prefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('email')
      .eq('unsubscribe_token', token)
      .single();

    if (prefsError || !prefs) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const email = prefs.email;

    // Update preferences
    const { error: updateError } = await supabase
      .from('email_preferences')
      .update({
        opt_in_marketing: optInMarketing,
        opt_in_transactional: optInTransactional,
        unsubscribed: !optInMarketing && !optInTransactional,
        unsubscribe_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('unsubscribe_token', token);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    // Update contact status if they unsubscribed from everything
    if (!optInMarketing && !optInTransactional) {
      await supabase
        .from('crm_contacts')
        .update({ email_status: 'unsubscribed' })
        .eq('email', email);

      // Add activity
      const { data: contact } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('email', email)
        .single();

      if (contact) {
        await supabase
          .from('crm_contact_activities')
          .insert({
            id: nanoid(),
            contact_id: contact.id,
            type: 'unsubscribed',
            description: 'Unsubscribed from all emails',
            metadata: { reason },
          });
      }
    }

    return res.status(200).json({ success: true, email });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
