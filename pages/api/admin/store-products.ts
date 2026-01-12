import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  // Only staff members can manage store products
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email as string)
    .single();

  if (!user || userError || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  switch (req.method) {
    case 'GET':
      return getStoreProducts(req, res);
    case 'POST':
      return createStoreProduct(req, res, user.id);
    case 'PUT':
      return updateStoreProduct(req, res, user.id);
    case 'DELETE':
      return deleteStoreProduct(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getStoreProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { data: products, error } = await supabase
      .from('store_products')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching store products:', error);
    return res.status(500).json({ error: 'Failed to fetch store products' });
  }
}

async function createStoreProduct(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { name, price, salePrice, image, category, subcategory, link, featured, displayOrder, isActive } = req.body;

    if (!name || !price || !image || !category || !link) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: product, error: createError } = await supabase
      .from('store_products')
      .insert({
        id: uuidv4(),
        name,
        price: parseFloat(price),
        sale_price: salePrice ? parseFloat(salePrice) : null,
        image,
        category,
        subcategory: subcategory || null,
        link,
        featured: featured || false,
        display_order: displayOrder || 0,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'CREATE_STORE_PRODUCT',
        entity: 'store_products',
        entityId: product.id,
        details: `Created store product: ${name}`,
      });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating store product:', error);
    return res.status(500).json({ error: 'Failed to create store product' });
  }
}

async function updateStoreProduct(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { id, name, price, salePrice, image, category, subcategory, link, featured, displayOrder, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const updateData: any = {
      name,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      image,
      category,
      subcategory,
      link,
      featured,
      display_order: displayOrder,
      is_active: isActive,
    };

    const { data: product, error: updateError } = await supabase
      .from('store_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'UPDATE_STORE_PRODUCT',
        entity: 'store_products',
        entityId: product.id,
        details: `Updated store product: ${name}`,
      });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating store product:', error);
    return res.status(500).json({ error: 'Failed to update store product' });
  }
}

async function deleteStoreProduct(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const { data: product, error: findError } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', id)
      .single();

    if (!product || findError) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { error: deleteError } = await supabase
      .from('store_products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        id: uuidv4(),
        userId,
        action: 'DELETE_STORE_PRODUCT',
        entity: 'store_products',
        entityId: id,
        details: `Deleted store product: ${product.name}`,
      });

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting store product:', error);
    return res.status(500).json({ error: 'Failed to delete store product' });
  }
}
