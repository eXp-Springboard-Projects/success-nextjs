import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      // Get all posts for the user with results
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(`
          id, user_id, content, image_url, link_url,
          platforms, status, scheduled_at, posted_at,
          auto_generated, created_at,
          social_post_results (
            platform, success, error_message, platform_post_url
          )
        `)
        .eq('user_id', session.user.id)
        .order('status', { ascending: true }) // SCHEDULED first
        .order('scheduled_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform results to match expected format
      const transformedPosts = (posts || []).map(post => ({
        ...post,
        results: post.social_post_results || []
      }));

      return res.status(200).json({ posts: transformedPosts });
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, imageUrl, linkUrl, platforms, scheduledAt, postNow } = req.body;

      if (!content || !platforms || platforms.length === 0) {
        return res.status(400).json({ error: 'Content and platforms are required' });
      }

      const supabase = supabaseAdmin();

      // Create post
      const { data: post, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: session.user.id,
          content,
          image_url: imageUrl || null,
          link_url: linkUrl || null,
          platforms,
          status: postNow ? 'POSTING' : scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduled_at: scheduledAt || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      if (postNow) {
        // TODO: Trigger posting job
        // For now, we'll just mark it as POSTING
        // In production, this would call a background job to actually post to the platforms
      }

      return res.status(201).json({
        success: true,
        postId: post.id,
        message: postNow ? 'Post is being published' : 'Post scheduled successfully'
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
