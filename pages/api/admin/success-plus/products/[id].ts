import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (req.method === 'GET') {
    return getProduct(id, res);
  } else if (req.method === 'PUT') {
    return updateProduct(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteProduct(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getProduct(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      error: 'Failed to fetch product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function updateProduct(id: string, req: NextApiRequest, res: NextApiResponse) {
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
      stock,
      thumbnail,
      images,
      externalUrl,
      isFeatured,
      isPublished,
      metadata,
    } = req.body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (salePrice !== undefined) updates.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = subcategory;
    if (sku !== undefined) updates.sku = sku;
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (images !== undefined) updates.images = images;
    if (externalUrl !== undefined) updates.externalUrl = externalUrl;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;
    if (isPublished !== undefined) updates.isPublished = isPublished;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      error: 'Failed to update product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function deleteProduct(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      error: 'Failed to delete product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
