import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user?.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'PUT') {
    try {
      const { slug, title, publishDate, coverImageUrl, readerUrl } = req.body;

      if (!slug || !title || !publishDate || !coverImageUrl || !readerUrl) {
        return res.status(400).json({
          error: 'All fields are required: slug, title, publishDate, coverImageUrl, readerUrl'
        });
      }

      const { data, error } = await supabase
        .from('magazine_issues')
        .update({
          slug,
          title,
          publish_date: publishDate,
          cover_image_url: coverImageUrl,
          reader_url: readerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        issue: data,
      });
    } catch (error: any) {
      console.error('Error updating magazine issue:', error);
      return res.status(500).json({ error: error.message || 'Failed to update issue' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('magazine_issues')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Issue deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting magazine issue:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete issue' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
