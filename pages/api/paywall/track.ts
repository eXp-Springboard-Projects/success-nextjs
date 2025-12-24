import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const session = await getServerSession(req, res, authOptions);
    const { articleId, articleTitle, articleUrl } = req.body;

    // Get paywall config
    const { data: config } = await supabase
      .from('paywall_config')
      .select('*')
      .limit(1)
      .single();

    const freeArticleLimit = config?.freeArticleLimit || 3;
    const resetPeriodDays = config?.resetPeriodDays || 30;

    // Check if user has active subscription through member
    if (session?.user) {
      const { data: user } = await supabase
        .from('users')
        .select(`
          *,
          member:members!inner (
            *,
            subscriptions (*)
          )
        `)
        .eq('id', session.user.id)
        .single();

      const subscription = user?.member?.subscriptions?.find((s: any) => s.status === 'ACTIVE');

      if (subscription) {
        // Subscriber - track but don't count against limit
        await supabase
          .from('page_views')
          .insert({
            id: randomUUID(),
            userId: session.user.id,
            articleId,
            articleTitle,
            articleUrl,
            ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          });

        return res.status(200).json({ blocked: false, count: 0, isSubscriber: true });
      }
    }

    // Calculate reset date
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() - resetPeriodDays);

    let userId: string | null = null;
    let sessionId: string | null = null;

    // Logged-in user tracking
    if (session?.user) {
      userId = session.user.id;

      // Count views since reset date
      const { count: viewCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .gte('viewedAt', resetDate.toISOString());

      // Track this view
      await supabase
        .from('page_views')
        .insert({
          id: randomUUID(),
          userId,
          articleId,
          articleTitle,
          articleUrl,
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });

      const blocked = (viewCount || 0) >= freeArticleLimit;

      return res.status(200).json({
        blocked,
        count: (viewCount || 0) + 1,
        limit: freeArticleLimit,
        isSubscriber: false
      });
    }

    // Anonymous user tracking (cookie-based)
    // Get or create session ID
    sessionId = req.cookies.paywallSession || null;
    if (!sessionId) {
      sessionId = uuidv4();
      res.setHeader('Set-Cookie', `paywallSession=${sessionId}; Path=/; Max-Age=2592000; SameSite=Lax`); // 30 days
    }

    // Count views for this session since reset date
    const { count: viewCount } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('sessionId', sessionId)
      .gte('viewedAt', resetDate.toISOString());

    // Track this view
    await supabase
      .from('page_views')
      .insert({
        id: randomUUID(),
        sessionId,
        articleId,
        articleTitle,
        articleUrl,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

    const blocked = (viewCount || 0) >= freeArticleLimit;

    return res.status(200).json({
      blocked,
      count: (viewCount || 0) + 1,
      limit: freeArticleLimit,
      isSubscriber: false
    });
  } catch (error) {
    console.error('Paywall track error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
