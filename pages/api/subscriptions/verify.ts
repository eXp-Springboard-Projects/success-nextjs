import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getActiveSubscription } from '../../../lib/access-control';

/**
 * API endpoint to verify user's subscription status
 * Returns current subscription details including tier, provider, and expiration
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        subscription: {
          hasActiveSubscription: false,
          tier: 'free',
          provider: null,
        }
      });
    }

    // Get active subscription status
    const subscription = await getActiveSubscription(session.user.id);

    return res.status(200).json({
      subscription: {
        hasActiveSubscription: subscription.hasActiveSubscription,
        tier: subscription.tier,
        provider: subscription.provider,
        subscriptionId: subscription.subscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      user: {
        email: session.user.email,
        name: session.user.name,
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to verify subscription',
      subscription: {
        hasActiveSubscription: false,
        tier: 'free',
        provider: null,
      }
    });
  }
}
