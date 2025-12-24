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
    const session = await getServerSession(req, res, authOptions);
    const {
      event,
      page,
      title,
      referrer,
      metadata = {},
    } = req.body;

    // Get or create session ID for anonymous tracking
    let sessionId = req.cookies.analyticsSession;
    if (!sessionId) {
      sessionId = uuidv4();
      res.setHeader(
        'Set-Cookie',
        `analyticsSession=${sessionId}; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax`
      );
    }

    // Get user agent and IP
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                      req.socket.remoteAddress ||
                      '';

    // Parse user agent for device info (basic parsing)
    const deviceType = /mobile|android|iphone|ipad|tablet/i.test(userAgent)
      ? 'mobile'
      : /tablet|ipad/i.test(userAgent)
      ? 'tablet'
      : 'desktop';

    const browser = userAgent.includes('Chrome')
      ? 'Chrome'
      : userAgent.includes('Firefox')
      ? 'Firefox'
      : userAgent.includes('Safari')
      ? 'Safari'
      : userAgent.includes('Edge')
      ? 'Edge'
      : 'Other';

    const os = userAgent.includes('Windows')
      ? 'Windows'
      : userAgent.includes('Mac')
      ? 'macOS'
      : userAgent.includes('Linux')
      ? 'Linux'
      : userAgent.includes('Android')
      ? 'Android'
      : userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')
      ? 'iOS'
      : 'Other';

    // Create analytics event
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('content_analytics')
      .insert({
        id: randomUUID(),
        contentId: metadata.postId || page,
        contentType: metadata.contentType || 'page',
        contentSlug: page,
        contentTitle: title,
        views: event === 'pageview' ? 1 : 0,
        uniqueVisitors: 1, // Will be aggregated in dashboard queries
        avgTimeOnPage: metadata.timeOnPage || 0,
        bounceRate: metadata.bounced ? 1 : 0,
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify({
          event,
          page,
          title,
          referrer,
          sessionId,
          userId: session?.user?.id,
          deviceType,
          browser,
          os,
          ipAddress,
          ...metadata,
        }),
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to track event' });
  }
}
