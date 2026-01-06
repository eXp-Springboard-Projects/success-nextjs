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

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { data: issues, error } = await supabase
        .from('magazine_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        issues: issues || [],
      });
    } catch (error: any) {
      console.error('Error fetching magazine issues:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch issues' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { slug, title, publishDate, coverImageUrl, readerUrl } = req.body;

      if (!slug || !title || !publishDate || !coverImageUrl || !readerUrl) {
        return res.status(400).json({
          error: 'All fields are required: slug, title, publishDate, coverImageUrl, readerUrl'
        });
      }

      // Check if slug already exists
      const { data: existing } = await supabase
        .from('magazine_issues')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'An issue with this slug already exists' });
      }

      const { data: newIssue, error } = await supabase
        .from('magazine_issues')
        .insert({
          slug,
          title,
          publish_date: publishDate,
          cover_image_url: coverImageUrl,
          reader_url: readerUrl,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        issue: newIssue,
      });
    } catch (error: any) {
      console.error('Error creating magazine issue:', error);
      return res.status(500).json({ error: error.message || 'Failed to create issue' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
