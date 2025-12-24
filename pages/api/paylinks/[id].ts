import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Only admins can manage paylinks
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid paylink ID' });
  }

  switch (req.method) {
    case 'GET':
      return getPayLink(id, res);
    case 'PUT':
      return updatePayLink(id, req, res, session);
    case 'DELETE':
      return deletePayLink(id, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPayLink(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { data: paylink, error } = await supabase
      .from('pay_links')
      .select('*, users(id, name, email)')
      .eq('id', id)
      .single();

    if (!paylink || error) {
      return res.status(404).json({ error: 'Paylink not found' });
    }

    return res.status(200).json(paylink);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch paylink' });
  }
}

async function updatePayLink(id: string, req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      description,
      amount,
      status,
      expiresAt,
      maxUses,
      requiresShipping,
      customFields,
      metadata,
    } = req.body;

    // Check if paylink exists
    const { data: existingLink, error: findError } = await supabase
      .from('pay_links')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingLink || findError) {
      return res.status(404).json({ error: 'Paylink not found' });
    }

    // Update Stripe price if amount changed and Stripe is configured
    let stripePriceId = existingLink.stripePriceId;

    if (amount && amount !== existingLink.amount.toNumber() && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('../../../lib/stripe').stripe;

        // Create new Stripe price (can't update existing price amount)
        const price = await stripe.prices.create({
          product: existingLink.stripeProductId,
          unit_amount: Math.round(amount * 100),
          currency: existingLink.currency.toLowerCase(),
          metadata: {
            paylink_slug: existingLink.slug,
            updated_at: new Date().toISOString(),
          },
        });

        stripePriceId = price.id;

        // Archive old price
        if (existingLink.stripePriceId) {
          await stripe.prices.update(existingLink.stripePriceId, {
            active: false,
          });
        }
      } catch (stripeError) {
      }
    }

    // Update paylink
    const { data: updatedPaylink, error: updateError } = await supabase
      .from('pay_links')
      .update({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(amount && { amount, stripePriceId }),
        ...(status && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }),
        ...(maxUses !== undefined && { maxUses }),
        ...(requiresShipping !== undefined && { requiresShipping }),
        ...(customFields !== undefined && { customFields }),
        ...(metadata !== undefined && { metadata }),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, users(id, name, email)')
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        userId: session.user.id,
        action: 'UPDATE_PAYLINK',
        entity: 'pay_link',
        entityId: id,
        details: JSON.stringify({ changes: req.body }),
      });

    return res.status(200).json(updatedPaylink);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update paylink' });
  }
}

async function deletePayLink(id: string, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const { data: paylink, error: findError } = await supabase
      .from('pay_links')
      .select('*')
      .eq('id', id)
      .single();

    if (!paylink || findError) {
      return res.status(404).json({ error: 'Paylink not found' });
    }

    // Archive Stripe product if exists
    if (paylink.stripeProductId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('../../../lib/stripe').stripe;
        await stripe.products.update(paylink.stripeProductId, {
          active: false,
        });
      } catch (stripeError) {
      }
    }

    // Delete paylink
    const { error: deleteError } = await supabase
      .from('pay_links')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        userId: session.user.id,
        action: 'DELETE_PAYLINK',
        entity: 'pay_link',
        entityId: id,
        details: JSON.stringify({ title: paylink.title, slug: paylink.slug }),
      });

    return res.status(200).json({ success: true, message: 'Paylink deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete paylink' });
  }
}
