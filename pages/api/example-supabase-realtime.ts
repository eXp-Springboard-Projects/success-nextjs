/**
 * Example API endpoint demonstrating Supabase real-time capabilities
 * alongside traditional Prisma queries
 *
 * This shows how to use both Prisma and Supabase in the same application
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Example 1: Fetch recent posts using Prisma (recommended for complex queries)
    const prismaRecentPosts = await prisma.posts.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        users: {
          select: { name: true, email: true },
        },
        categories: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // Example 2: Same query using Supabase (simpler for basic queries)
    const { data: supabaseRecentPosts, error: supabaseError } = await supabase
      .from('posts')
      .select('id, title, slug, status, publishedAt')
      .eq('status', 'PUBLISHED')
      .order('publishedAt', { ascending: false })
      .limit(5);

    if (supabaseError) {
      console.error('Supabase query error:', supabaseError);
    }

    // Example 3: Get stats using Prisma
    const stats = {
      totalPosts: await prisma.posts.count(),
      publishedPosts: await prisma.posts.count({
        where: { status: 'PUBLISHED' },
      }),
      totalUsers: await prisma.users.count(),
      activeSubscriptions: await prisma.subscriptions.count({
        where: { status: 'active' },
      }),
    };

    return res.status(200).json({
      message: 'Both Prisma and Supabase are working!',
      examples: {
        prismaQuery: {
          description: 'Complex query with relations using Prisma',
          count: prismaRecentPosts.length,
          data: prismaRecentPosts,
        },
        supabaseQuery: {
          description: 'Simple query using Supabase',
          count: supabaseRecentPosts?.length || 0,
          data: supabaseRecentPosts,
        },
        stats,
      },
      usage: {
        prisma: {
          strength: 'Complex queries with relations and type safety',
          example: 'Use for joins, transactions, migrations',
        },
        supabase: {
          strength: 'Real-time subscriptions and simple CRUD',
          example: 'Use for live updates, file storage, RLS',
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
