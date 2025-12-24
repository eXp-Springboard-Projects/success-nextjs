import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins can view system alerts
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const { resolved, category, severity, limit = 50 } = req.query;
      const supabase = supabaseAdmin();

      let query = supabase
        .from('system_alerts')
        .select('*');

      if (resolved === 'false') {
        query = query.eq('isResolved', false);
      } else if (resolved === 'true') {
        query = query.eq('isResolved', true);
      }

      if (category) {
        query = query.eq('category', category as string);
      }

      if (severity) {
        query = query.eq('severity', parseInt(severity as string));
      }

      const { data: alerts, error } = await query
        .order('isResolved', { ascending: true })
        .order('severity', { ascending: false })
        .order('createdAt', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) throw error;

      return res.status(200).json(alerts);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch system alerts' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
