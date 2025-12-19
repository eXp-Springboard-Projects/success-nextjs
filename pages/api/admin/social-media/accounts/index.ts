import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';

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
      // Get all social media accounts for the user
      const accounts = await prisma.$queryRaw`
        SELECT id, user_id, platform, account_name, account_id, is_active,
               token_expires_at, last_error, created_at
        FROM social_accounts
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ accounts });
    } catch (error: any) {
      console.error('Error fetching social accounts:', error);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
