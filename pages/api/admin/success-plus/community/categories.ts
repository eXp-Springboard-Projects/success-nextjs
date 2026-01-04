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
        return await getCategories(req, res, supabase);
      case 'POST':
        return await createCategory(req, res, supabase);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Community categories API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getCategories(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const { includeInactive = 'false' } = req.query;

  let query = supabase
    .from('community_categories')
    .select(`
      *,
      community_topics(count)
    `)
    .order('order', { ascending: true });

  if (includeInactive !== 'true') {
    query = query.eq('isActive', true);
  }

  const { data: categories, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }

  const formattedCategories = categories?.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    order: cat.order,
    isActive: cat.isActive,
    topicCount: cat.community_topics?.[0]?.count || 0,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  })) || [];

  return res.status(200).json({
    success: true,
    categories: formattedCategories,
  });
}

async function createCategory(req: NextApiRequest, res: NextApiResponse, supabase: any) {
  const {
    name,
    slug,
    description,
    icon,
    color,
    order = 0,
    isActive = true,
  } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  // Check if slug already exists
  const { data: existing } = await supabase
    .from('community_categories')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'A category with this slug already exists' });
  }

  const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: category, error } = await supabase
    .from('community_categories')
    .insert({
      id: categoryId,
      name,
      slug,
      description,
      icon,
      color,
      order,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }

  return res.status(201).json({
    success: true,
    category,
  });
}
