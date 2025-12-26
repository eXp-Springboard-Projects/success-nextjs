import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', status = 'all' } = req.query;
    const limit = parseInt(per_page as string);

    // Fetch from BOTH sources in parallel
    const [wpPosts, localPosts] = await Promise.all([
      // WordPress posts
      fetchWordPressData(`posts?_embed&per_page=${per_page}${status !== 'all' ? `&status=${status}` : ''}`).catch(() => []),

      // Local Supabase posts
      (async () => {
        try {
          const supabase = supabaseAdmin();
          let query = supabase
            .from('posts')
            .select(`
              *,
              users!posts_authorId_fkey (id, name, email),
              post_categories (categories (*))
            `)
            .order('publishedAt', { ascending: false })
            .limit(limit);

          if (status !== 'all') {
            query = query.eq('status', status.toString().toUpperCase());
          }

          const { data } = await query;
          return data || [];
        } catch (e) {
          return [];
        }
      })()
    ]);

    // Format WordPress posts (external source)
    const formattedWpPosts = (wpPosts || []).map((post: any) => ({
      ...post,
      type: 'posts',
      link: `/blog/${post.slug}`,
      source: 'wordpress',
      editable: false,
    }));

    // Format local posts (editable)
    const formattedLocalPosts = (localPosts || []).map((post: any) => {
      const categories = post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];

      return {
        id: post.id,
        title: { rendered: post.title },
        slug: post.slug,
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt || '' },
        status: post.status?.toLowerCase() || 'draft',
        date: post.publishedAt || post.createdAt,
        modified: post.updatedAt,
        type: 'posts',
        link: `/blog/${post.slug}`,
        source: 'local',
        editable: true,
        _embedded: {
          'wp:featuredmedia': post.featuredImage ? [{
            source_url: post.featuredImage,
            alt_text: post.featuredImageAlt || ''
          }] : [],
          author: [{
            id: post.users?.id,
            name: post.users?.name || 'Unknown'
          }],
          'wp:term': [
            categories.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug
            }))
          ]
        }
      };
    });

    // Combine and sort by date
    const allPosts = [...formattedWpPosts, ...formattedLocalPosts].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    return res.status(200).json(allPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
