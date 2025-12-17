/**
 * API Endpoint: /api/admin/permissions/check
 * Check if current user has permission to access a page
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { checkPagePermission } from '../../../../lib/auth/pagePermissions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pagePath } = req.body;

  if (!pagePath) {
    return res.status(400).json({ error: 'Page path is required' });
  }

  try {
    const permission = await checkPagePermission(session.user.id, pagePath);

    return res.status(200).json(permission);
  } catch (error: any) {
    console.error('Permission check error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
