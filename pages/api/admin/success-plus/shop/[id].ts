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

  const { id } = req.query;
  const supabase = supabaseAdmin();

  try {
    switch (req.method) {
      case 'GET':
        return await getProduct(id as string, res, supabase);
      case 'PUT':
        return await updateProduct(id as string, req, res, supabase);
      case 'DELETE':
        return await deleteProduct(id as string, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Shop Product API Error:', {
      productId: id,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getProduct(id: string, res: NextApiResponse, supabase: any) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json({
    success: true,
    product,
  });
}

async function updateProduct(id: string, req: NextApiRequest, res: NextApiResponse, supabase: any) {
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
    status,
    featured,
    metadata,
    inventory,
    stripeProductId,
    stripePriceId,
  } = req.body;

  // Check if slug is being changed and already exists
  if (slug) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'A product with this slug already exists' });
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (salePrice !== undefined) updateData.salePrice = salePrice;
  if (sku !== undefined) updateData.sku = sku;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (images !== undefined) updateData.images = images;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = featured;
  if (metadata !== undefined) updateData.metadata = metadata;
  if (inventory !== undefined) updateData.inventory = inventory;
  if (stripeProductId !== undefined) updateData.stripeProductId = stripeProductId;
  if (stripePriceId !== undefined) updateData.stripePriceId = stripePriceId;

  const { data: product, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }

  return res.status(200).json({
    success: true,
    product,
  });
}

async function deleteProduct(id: string, res: NextApiResponse, supabase: any) {
  // Check if product has orders (if order_items table exists)
  // This is a safety check to prevent deletion of products with purchase history
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('productId', id)
    .limit(1);

  if (orderItems && orderItems.length > 0) {
    return res.status(400).json({
      error: 'Cannot delete product with order history. Archive it instead.',
      suggestion: 'Set status to ARCHIVED',
    });
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }

  return res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
}
