import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const skip = (pageNum - 1) * perPageNum;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    };

    // Full-text search on title and content
    const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
    where.OR = searchTerms.map(term => ([
      { title: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
      { excerpt: { contains: term, mode: 'insensitive' } },
    ])).flat();

    // Category filter
    if (category && category !== 'all') {
      where.categories = {
        some: {
          slug: category,
        },
      };
    }

    // Author filter
    if (author && author !== 'all') {
      where.authorId = author;
    }

    // Determine content type
    let model: any;
    switch (type) {
      case 'video':
        model = prisma.videos;
        break;
      case 'podcast':
        model = prisma.podcasts;
        break;
      case 'page':
        model = prisma.pages;
        where.status = undefined; // Pages don't have status in same way
        break;
      default:
        model = prisma.posts;
    }

    // Fetch results
    const [results, total] = await Promise.all([
      model.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          categories: true,
        },
        orderBy: sort === 'date'
          ? { publishedAt: 'desc' }
          : sort === 'views'
          ? { views: 'desc' }
          : { updatedAt: 'desc' }, // Relevance fallback
        skip,
        take: perPageNum,
      }),
      model.count({ where }),
    ]);

    // Calculate relevance scores
    const scoredResults = results.map((result: any) => {
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
    return res.status(500).json({ error: 'Search failed' });
  }
}
