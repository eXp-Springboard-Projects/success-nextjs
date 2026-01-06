import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has active subscription (for premium resources)
  // For now, allow all authenticated users
  // TODO: Add subscription check when Stripe is configured

  try {
    const { category, search } = req.query;
    const supabase = supabaseAdmin();

    let query = supabase
      .from('resources')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const transformedResources = (data || []).map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description || '',
      category: resource.category,
      fileUrl: resource.fileUrl,
      fileType: resource.fileType || 'pdf',
      fileSize: resource.fileSize || 0,
      fileName: resource.fileName,
      downloads: resource.downloadCount || 0,
      createdAt: resource.createdAt,
      featured: resource.featured || false,
    }));

    return res.status(200).json({ resources: transformedResources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ message: 'Failed to fetch resources' });
  }
}
