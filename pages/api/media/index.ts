import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const supabase = supabaseAdmin();

    try {
      const {
        page = '1',
        per_page = '100',
        search = '',
      } = req.query;

      const pageNum = parseInt(page as string);
      const perPage = parseInt(per_page as string);
      const offset = (pageNum - 1) * perPage;

      // Build query
      let query = supabase
        .from('media')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(offset, offset + perPage - 1);

      // Add search filter if provided
      if (search) {
        query = query.or(`filename.ilike.%${search}%,alt.ilike.%${search}%`);
      }

      const { data: media, error, count } = await query;

      if (error) {
        throw error;
      }

      const total = count || 0;

      // Add pagination headers
      res.setHeader('X-Total', total.toString());
      res.setHeader('X-Total-Pages', Math.ceil(total / perPage).toString());

      return res.status(200).json(media);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
