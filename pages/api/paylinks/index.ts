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

  switch (req.method) {
    case 'GET':
      return getPayLinks(req, res, session);
    case 'POST':
      return createPayLink(req, res, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPayLinks(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const { status, search } = req.query;

    let query = supabase
      .from('pay_links')
      .select('*, users(id, name, email)')
      .order('createdAt', { ascending: false });

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by title or slug
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: paylinks, error } = await query;

    if (error) throw error;

    // Calculate if expired
    const paylinkswithExpiry = (paylinks || []).map((link: any) => ({
      ...link,
      isExpired: link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
      isMaxedOut: link.maxUses ? link.currentUses >= link.maxUses : false,
    }));

    return res.status(200).json(paylinkswithExpiry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch paylinks' });
  }
}

async function createPayLink(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      description,
      amount,
      currency = 'USD',
      slug,
      expiresAt,
      maxUses,
      requiresShipping,
      customFields,
      metadata,
    } = req.body;

    // Validation
    if (!title || !amount || !slug) {
      return res.status(400).json({ error: 'Title, amount, and slug are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check if slug already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('pay_links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (existingLink && !checkError) {
      return res.status(400).json({ error: 'Slug already exists. Please choose a different slug.' });
    }

    // Create Stripe price if Stripe is configured
    let stripePriceId = null;
    let stripeProductId = null;

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('../../../lib/stripe').stripe;

        // Create Stripe product
        const product = await stripe.products.create({
          name: title,
          description: description || undefined,
          metadata: {
            paylink_slug: slug,
            created_by: session.user.id,
          },
        });

        stripeProductId = product.id;

        // Create Stripe price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata: {
            paylink_slug: slug,
          },
        });

        stripePriceId = price.id;
      } catch (stripeError) {
        // Continue without Stripe if it fails
      }
    }

    // Create paylink
    const { data: paylink, error: createError } = await supabase
      .from('pay_links')
      .insert({
        id: randomUUID(),
        userId: session.user.id,
        title,
        description,
        amount,
        currency,
        slug,
        stripePriceId,
        stripeProductId,
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        maxUses: maxUses || null,
        currentUses: 0,
        requiresShipping: requiresShipping || false,
        customFields: customFields || null,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('*, users(id, name, email)')
      .single();

    if (createError) throw createError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        userId: session.user.id,
        action: 'CREATE_PAYLINK',
        entity: 'pay_link',
        entityId: paylink.id,
        details: JSON.stringify({ title, slug, amount, currency }),
      });

    return res.status(201).json(paylink);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create paylink' });
  }
}
