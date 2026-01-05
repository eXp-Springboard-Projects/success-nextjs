import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug: Check if env var is loaded
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

    const supabase = supabaseAdmin();

    const { firstName, lastName, phone, email } = req.body;

    // Validation
    if (!firstName || !lastName || !phone || !email) {
      return res.status(400).json({
        error: 'All fields are required: firstName, lastName, phone, email'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Basic phone validation (allows various formats)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Check if phone or email already subscribed
    const { data: existingList, error: checkError } = await supabase
      .from('sms_subscribers')
      .select('id, phone, email, active')
      .or(`phone.eq.${phone},email.eq.${email}`);

    if (checkError) {
      console.error('Error checking existing subscriber:', checkError);
      return res.status(500).json({ error: 'Failed to check existing subscription' });
    }

    const existing = existingList && existingList.length > 0 ? existingList[0] : null;

    if (existing) {
      if (existing.active) {
        const matchedField = existing.phone === phone ? 'phone number' : 'email';
        return res.status(409).json({
          error: `This ${matchedField} is already subscribed to daily quotes.`
        });
      } else {
        // Reactivate inactive subscription
        const { error: updateError } = await supabase
          .from('sms_subscribers')
          .update({
            first_name: firstName,
            last_name: lastName,
            phone,
            email,
            active: true,
            resubscribed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error reactivating subscription:', updateError);
          return res.status(500).json({ error: 'Failed to reactivate subscription' });
        }

        return res.status(200).json({
          success: true,
          message: 'Subscription reactivated successfully!',
          reactivated: true,
        });
      }
    }

    // Insert new subscriber
    const { data: newSubscriber, error: insertError } = await supabase
      .from('sms_subscribers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        active: true,
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed to daily inspirational quotes!',
      subscriber: {
        id: newSubscriber.id,
        firstName: newSubscriber.first_name,
        lastName: newSubscriber.last_name,
      },
    });

  } catch (error) {
    console.error('Unexpected error in daily-sms/subscribe:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
