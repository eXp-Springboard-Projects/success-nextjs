import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { Department } from '@/lib/types';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as any;

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.SUCCESS_PLUS)) {
    return res.status(403).json({ error: 'Forbidden - SUCCESS+ access required' });
  }

  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getProducts(req, res, supabase);
      case 'POST':
        return await createProduct(req, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Shop Products API Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getProducts(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    category,
    status = 'ACTIVE',
    featured,
    search,
    limit = '50',
    offset = '0'
  } = req.query;

  let query = supabase
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (featured === 'true') {
    query = query.eq('featured', true);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }

  return res.status(200).json({
    success: true,
    products: products || [],
    total: products?.length || 0,
  });
}

async function createProduct(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    name,
    slug,
    description,
    price,
    salePrice,
    sku,
    imageUrl,
    images,
    category,
    status = 'ACTIVE',
    featured = false,
    metadata,
    inventory,
    stripeProductId,
    stripePriceId,
  } = req.body;

  if (!name || !slug || price === undefined || !category) {
    return res.status(400).json({ error: 'Name, slug, price, and category are required' });
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'A product with this slug already exists' });
  }

  const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      id: productId,
      name,
      slug,
      description,
      price,
      salePrice,
      sku,
      imageUrl,
      images,
      category,
      status,
      featured,
      metadata,
      inventory: inventory || 0,
      stripeProductId,
      stripePriceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }

  return res.status(201).json({
    success: true,
    product,
  });
}
