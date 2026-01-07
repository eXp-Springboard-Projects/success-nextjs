// Cron Endpoint: Process Workflows
// Processes scheduled actions and job queue
// Call this endpoint from Vercel Cron or external cron service

import { NextApiRequest, NextApiResponse } from 'next';
import { jobQueueProcessor } from '@/lib/queue/processor';
import { scheduledActionsProcessor } from '@/lib/queue/scheduled-actions-processor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = req.headers['x-cron-secret'];

  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('[Cron] Starting workflow processors...');

    const startTime = Date.now();

    // Process scheduled actions
    await scheduledActionsProcessor.start();

    // Process job queue
    await jobQueueProcessor.start();

    const duration = Date.now() - startTime;

    console.log(`[Cron] Workflow processors completed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error processing workflows:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
