import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('courses')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ course: data });
    } catch (error: any) {
      console.error('Error updating course:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Course deleted' });
    } catch (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
