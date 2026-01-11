import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getProducts(req, res);
  } else if (req.method === 'POST') {
    return createProduct(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { category, search, published } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (published === 'true') {
      query = query.eq('isPublished', true);
    } else if (published === 'false') {
      query = query.eq('isPublished', false);
    }

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ products: products || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      slug,
      description,
      price,
      salePrice,
      category,
      subcategory,
      sku,
      stock = 0,
      thumbnail,
      images = [],
      externalUrl,
      isFeatured = false,
      isPublished = false,
      metadata = {},
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ error: 'Title, price, and category are required' });
    }

    const productId = nanoid();
    const productSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }

    const now = new Date().toISOString();
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        id: productId,
        title,
        slug: productSlug,
        description: description || null,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        category,
        subcategory: subcategory || null,
        sku: sku || null,
        stock: parseInt(stock),
        thumbnail: thumbnail || null,
        images,
        externalUrl: externalUrl || null,
        isFeatured,
        isPublished,
        metadata,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
