import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { category } = req.query;

      let query = supabase
        .from('resources')
        .select('*')
        .order('createdAt', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({ resources: data || [] });
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ message: 'Failed to fetch resources' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, category, linkUrl, thumbnail, fileType } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('resources')
        .insert({
          title,
          description,
          category,
          linkUrl,
          fileType: fileType || 'link',
          thumbnail,
          downloads: 0,
          isActive: true,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Error creating resource:', error);
      return res.status(500).json({ message: 'Failed to create resource' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
