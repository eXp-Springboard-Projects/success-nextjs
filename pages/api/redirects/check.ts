import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    const { data: redirect } = await supabase
      .from('url_redirects')
      .select('*')
      .eq('oldUrl', path)
      .eq('isActive', true)
      .single();

    if (redirect) {
      return res.status(200).json({
        found: true,
        newUrl: redirect.newUrl,
        statusCode: redirect.statusCode
      });
    }

    return res.status(404).json({ found: false });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
