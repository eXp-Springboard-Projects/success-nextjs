import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const {
      q = '',
      category,
      author,
      type = 'post',
      sort = 'relevance',
      page = '1',
      perPage = '20',
    } = req.query;

    const query = q as string;
    const pageNum = parseInt(page as string);
    const perPageNum = parseInt(perPage as string);
    const from = (pageNum - 1) * perPageNum;
    const to = from + perPageNum - 1;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerms = query.trim().split(' ').filter(term => term.length > 0);

    // Determine content table
    let tableName = 'posts';
    switch (type) {
      case 'video':
        tableName = 'videos';
        break;
      case 'podcast':
        tableName = 'podcasts';
        break;
      case 'page':
        tableName = 'pages';
        break;
      default:
        tableName = 'posts';
    }

    // Build query
    let supabaseQuery = supabase
      .from(tableName)
      .select('*, users(id, name, avatar), post_categories(categories(*))', { count: 'exact' });

    // Add status filter (except for pages)
    if (tableName !== 'pages') {
      supabaseQuery = supabaseQuery.eq('status', 'PUBLISHED');
    }

    // Add text search using OR conditions
    const searchPattern = `%${query}%`;
    supabaseQuery = supabaseQuery.or(`title.ilike.${searchPattern},content.ilike.${searchPattern},excerpt.ilike.${searchPattern}`);

    // Category filter
    if (category && category !== 'all') {
      // This requires a more complex query with joins
      // For now, we'll fetch and filter after
    }

    // Author filter
    if (author && author !== 'all') {
      supabaseQuery = supabaseQuery.eq('authorId', author);
    }

    // Apply sort
    if (sort === 'date') {
      supabaseQuery = supabaseQuery.order('publishedAt', { ascending: false });
    } else if (sort === 'views') {
      supabaseQuery = supabaseQuery.order('views', { ascending: false });
    } else {
      supabaseQuery = supabaseQuery.order('updatedAt', { ascending: false });
    }

    // Pagination
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: results, error: searchError, count } = await supabaseQuery;

    if (searchError) throw searchError;

    // Calculate relevance scores
    const scoredResults = (results || []).map((result: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const lowerTitle = (result.title || '').toLowerCase();
      const lowerContent = (result.content || '').toLowerCase();
      const lowerExcerpt = (result.excerpt || '').toLowerCase();

      // Title matches score higher
      if (lowerTitle.includes(lowerQuery)) score += 10;
      searchTerms.forEach(term => {
        if (lowerTitle.includes(term.toLowerCase())) score += 5;
      });

      // Excerpt matches
      if (lowerExcerpt.includes(lowerQuery)) score += 5;
      searchTerms.forEach(term => {
        if (lowerExcerpt.includes(term.toLowerCase())) score += 2;
      });

      // Content matches
      const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'gi')) || []).length;
      score += contentMatches;

      return {
        ...result,
        relevanceScore: score,
      };
    });

    // Sort by relevance if requested
    if (sort === 'relevance') {
      scoredResults.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    }

    const total = count || 0;

    return res.status(200).json({
      results: scoredResults,
      total,
      page: pageNum,
      perPage: perPageNum,
      totalPages: Math.ceil(total / perPageNum),
      query,
      filters: {
        category,
        author,
        type,
        sort,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
