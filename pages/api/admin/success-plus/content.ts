import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin or SUCCESS_PLUS department access
    const supabase = supabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email!)
      .single();

    if (userError || !user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.primary_department !== 'SUCCESS_PLUS')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const { contentType, status } = req.query;

      // Note: This is a complex query with many-to-many relationships
      // For now, fetching all posts and filtering in application layer
      // TODO: Consider using RPC function for better performance

      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey(name, email)
        `)
        .order('published_at', { ascending: false })
        .limit(100);

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status.toString().toUpperCase());
      }

      const { data: posts, error: postsError } = await query;

      if (postsError) {
        throw postsError;
      }

      // Get categories for each post through junction table
      const postIds = posts?.map(p => p.id) || [];

      const { data: postCategories } = await supabase
        .from('post_categories')
        .select(`
          post_id,
          categories(name, slug)
        `)
        .in('post_id', postIds);

      // Build category map
      const categoryMap = new Map();
      postCategories?.forEach(pc => {
        if (!categoryMap.has(pc.post_id)) {
          categoryMap.set(pc.post_id, []);
        }
        categoryMap.get(pc.post_id).push(pc.categories);
      });

      // Filter posts by content type
      const filteredPosts = posts?.filter(post => {
        const categories = categoryMap.get(post.id) || [];
        const categorySlugs = categories.map((c: any) => c.slug.toLowerCase());

        const hasSuccessPlus = categorySlugs.includes('success-plus');
        const hasInsider = categorySlugs.includes('insider');
        const hasPremium = categorySlugs.includes('premium');

        // Only include posts with premium/insider/success-plus categories
        if (!hasSuccessPlus && !hasInsider && !hasPremium) {
          return false;
        }

        // Apply content type filter
        if (contentType && contentType !== 'all') {
          if (contentType === 'premium' && !hasSuccessPlus) {
            return false;
          }
          if (contentType === 'insider' && !hasInsider) {
            return false;
          }
        }

        return true;
      }) || [];

      return res.status(200).json({
        posts: filteredPosts.map((post) => {
          const categories = categoryMap.get(post.id) || [];
          const categorySlugs = categories.map((c: any) => c.slug.toLowerCase());
          const isInsider = categorySlugs.includes('insider');
          const isPremium = categorySlugs.includes('success-plus') || categorySlugs.includes('premium');

          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            contentType: isInsider ? 'insider' : 'premium',
            accessTier: isInsider ? 'insider' : 'success_plus',
            publishedAt: post.published_at,
            author: {
              name: post.users?.name || post.wordpress_author || 'Unknown',
              email: post.users?.email || '',
            },
            categories: categories,
          };
        }),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
