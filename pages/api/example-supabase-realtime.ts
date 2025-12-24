/**
 * Example API endpoint demonstrating Supabase real-time capabilities
 * alongside traditional Prisma queries
 *
 * This shows how to use both Prisma and Supabase in the same application
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    // Example 1: Fetch recent posts using Supabase with relations
    const { data: supabaseRecentPosts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        status,
        publishedAt,
        users (
          name,
          email
        ),
        categories (
          name,
          slug
        )
      `)
      .eq('status', 'PUBLISHED')
      .order('publishedAt', { ascending: false })
      .limit(5);

    if (postsError) {
      console.error('Supabase query error:', postsError);
    }

    // Example 2: Get stats using Supabase
    const [
      { count: totalPosts },
      { count: publishedPosts },
      { count: totalUsers },
      { count: activeSubscriptions },
    ] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const stats = {
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
    };

    return res.status(200).json({
      message: 'Supabase is working!',
      examples: {
        recentPosts: {
          description: 'Query with relations using Supabase',
          count: supabaseRecentPosts?.length || 0,
          data: supabaseRecentPosts,
        },
        stats,
      },
      usage: {
        supabase: {
          strength: 'Real-time subscriptions, simple CRUD, and complex queries',
          example: 'Use for live updates, file storage, RLS, and relations',
        },
      },
      nextSteps: [
        'Get your Supabase API keys from the dashboard',
        'Update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        'Run: npx tsx scripts/test-supabase-connection.ts',
        'See docs/SUPABASE_QUICK_START.md for examples',
      ],
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
