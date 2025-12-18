/**
 * Post Revisions API
 * Fetch revision history for a specific post
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const session = await getSession({ req });

  // Require authentication
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // This is a demo endpoint - in production, fetch from database
      // For now, return mock revision data

      const mockRevisions = [
        {
          id: 'rev-1',
          postId: id,
          title: 'Current version of the post',
          content: '<p>This is the current content...</p>',
          excerpt: 'Current excerpt',
          featuredImage: '/images/featured-current.jpg',
          featuredImageAlt: 'Current featured image',
          status: 'draft',
          seoTitle: 'Current SEO Title',
          seoDescription: 'Current SEO description',
          authorId: session.user?.id || 'user-1',
          authorName: session.user?.name || 'Current User',
          changeNote: 'Latest updates',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rev-2',
          postId: id,
          title: 'Previous version - edited title',
          content: '<p>Previous content version 2...</p>',
          excerpt: 'Previous excerpt 2',
          featuredImage: '/images/featured-prev2.jpg',
          featuredImageAlt: 'Previous featured image 2',
          status: 'draft',
          seoTitle: 'Previous SEO Title 2',
          seoDescription: 'Previous SEO description 2',
          authorId: 'user-2',
          authorName: 'Editor User',
          changeNote: 'Updated title and intro',
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: 'rev-3',
          postId: id,
          title: 'Original version',
          content: '<p>Original content...</p>',
          excerpt: 'Original excerpt',
          featuredImage: null,
          featuredImageAlt: null,
          status: 'draft',
          seoTitle: null,
          seoDescription: null,
          authorId: 'user-1',
          authorName: 'Author User',
          changeNote: 'Initial draft',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ];

      res.status(200).json(mockRevisions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch revisions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
