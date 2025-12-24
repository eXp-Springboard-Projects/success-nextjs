import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', perPage = '100', status = 'PENDING' } = req.query;
      const pageNum = parseInt(page as string);
      const perPageNum = parseInt(perPage as string);
      const skip = (pageNum - 1) * perPageNum;

      let query = supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .range(skip, skip + perPageNum - 1)
        .order('createdAt', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: comments, error, count } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json({
        comments: comments || [],
        total: count || 0,
        page: pageNum,
        perPage: perPageNum,
        totalPages: Math.ceil((count || 0) / perPageNum),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        postId,
        postTitle,
        author,
        authorEmail,
        authorUrl,
        content,
        ipAddress,
        userAgent,
      } = req.body;

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          id: randomUUID(),
          postId,
          postTitle,
          author,
          authorEmail,
          authorUrl,
          content,
          status: 'PENDING',
          ipAddress,
          userAgent,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(comment);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
