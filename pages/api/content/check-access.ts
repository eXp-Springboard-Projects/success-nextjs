/**
 * API endpoint to check if user has access to specific content
 *
 * Used by frontend to gate SUCCESS+ articles and premium content
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { canAccessContent, trackArticleView } from '../../../lib/membership';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { contentId, contentSlug, title, url, categories, tags, isInsiderOnly } = req.body;

    if (!contentId && !contentSlug) {
      return res.status(400).json({ error: 'Content ID or slug required' });
    }

    // Check access
    const accessCheck = await canAccessContent(session?.user?.id || null, {
      categories,
      tags,
      isInsiderOnly,
    });

    // If has access, track the view
    if (accessCheck.canAccess && session?.user?.id) {
      await trackArticleView(
        session.user.id,
        {
          id: contentId || contentSlug,
          title: title || 'Untitled',
          url: url || `/blog/${contentSlug}`,
        },
        req.headers['x-session-id'] as string,
        req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        req.headers['user-agent']
      );
    }

    return res.status(200).json(accessCheck);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to check content access', message: error.message });
  }
}
