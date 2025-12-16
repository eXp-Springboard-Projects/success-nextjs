import { NextApiRequest, NextApiResponse } from 'next';
import { getPreferencesByToken, updatePreferences, maskEmail } from '@/lib/email/preferences';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const preferences = await getPreferencesByToken(token);

      if (!preferences) {
        return res.status(404).json({ error: 'Invalid or expired link' });
      }

      return res.status(200).json({
        maskedEmail: maskEmail(preferences.email),
        optInMarketing: preferences.optInMarketing,
        optInNewsletter: preferences.optInNewsletter,
        optInTransactional: preferences.optInTransactional,
        unsubscribed: preferences.unsubscribed,
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { optInMarketing, optInNewsletter, optInTransactional, unsubscribed, unsubscribeReason } = req.body;

      await updatePreferences(token, {
        optInMarketing,
        optInNewsletter,
        optInTransactional,
        unsubscribed,
        unsubscribeReason,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating preferences:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
