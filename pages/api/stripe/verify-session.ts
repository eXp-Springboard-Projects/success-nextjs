import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Log successful conversion
      if (session.metadata?.userId && session.metadata.userId !== 'guest') {
        await supabase
          .from('activity_logs')
          .insert({
            id: randomUUID(),
            userId: session.metadata.userId,
            action: 'SUBSCRIPTION_CREATED',
            entity: 'subscription',
            details: `SUCCESS+ ${session.metadata?.tier} - ${session.metadata?.billingCycle}`,
            ipAddress: '',
          });
      }

      return res.status(200).json({
        success: true,
        tier: session.metadata?.tier,
        billingCycle: session.metadata?.billingCycle,
      });
    }

    return res.status(400).json({ error: 'Payment not completed' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}
