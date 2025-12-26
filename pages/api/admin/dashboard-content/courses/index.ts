import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'POST') {
    try {
      const { title, description, thumbnail, duration, level, isPublished } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          id: nanoid(),
          title,
          description,
          thumbnail: thumbnail || null,
          duration: duration || null,
          level: level || 'beginner',
          isPublished: isPublished || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ course: data });
    } catch (error: any) {
      console.error('Error creating course:', error);
      return res.status(500).json({ error: 'Failed to create course' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
