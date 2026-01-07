import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

// Public API endpoint to fetch author by slug
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Author slug is required' });
  }

  const supabase = supabaseAdmin();

  try {
    // Fetch author by slug
    const { data: author, error } = await supabase
      .from('authors')
      .select('*')
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error || !author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    return res.status(200).json(author);
  } catch (error: any) {
    console.error('Error fetching author:', error);
    return res.status(500).json({ error: 'Failed to fetch author', message: error.message });
  }
}
