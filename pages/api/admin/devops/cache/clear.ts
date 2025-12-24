import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
// Pages Router cache clearing - trigger on-demand ISR revalidation
      const pagesToRevalidate = [
        '/',
        '/blog',
        '/videos',
        '/podcasts',
        '/magazine',
      ];

      let revalidatedCount = 0;
      const errors: string[] = [];

      // Attempt to revalidate each path
      for (const path of pagesToRevalidate) {
        try {
          await res.revalidate(path);
          revalidatedCount++;
} catch (error) {
          const errorMsg = `Failed to clear cache for ${path}: ${error}`;
          errors.push(errorMsg);
        }
      }

      // Update the last cleared timestamp in database
      const timestamp = new Date().toISOString();
      await supabase
        .from('system_settings')
        .upsert({
          key: 'cache_last_cleared',
          value: timestamp,
          updatedAt: timestamp,
          updatedBy: session.user.email
        }, { onConflict: 'key' });

      // Log this action in audit logs
      await supabase
        .from('audit_logs')
        .insert({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userEmail: session.user.email,
          userName: session.user.name,
          action: 'cache.cleared',
          entityType: 'System',
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
          createdAt: timestamp
        });

      return res.status(200).json({
        message: `Cache cleared for ${revalidatedCount}/${pagesToRevalidate.length} pages`,
        revalidatedCount,
        totalPages: pagesToRevalidate.length,
        errors: errors.length > 0 ? errors : undefined,
        clearedAt: new Date().toISOString(),
        clearedBy: session.user.name
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
