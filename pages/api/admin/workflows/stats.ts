// API: Workflow Statistics
// Returns stats for workflow dashboard

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'STAFF') {
    return res.status(403).json({ message: 'Unauthorized - staff access required' });
  }

  try {
    const supabase = supabaseAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total executions
    const { count: totalExecutions } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true });

    // Get active workflows
    const { count: activeWorkflows } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get completed today
    const { count: completedToday } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completedAt', today.toISOString());

    // Get failed today
    const { count: failedToday } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('updatedAt', today.toISOString());

    // Get pending actions
    const { count: pendingActions } = await supabase
      .from('scheduled_actions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('executedAt', null);

    // Get pending jobs
    const { count: pendingJobs } = await supabase
      .from('job_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return res.status(200).json({
      totalExecutions: totalExecutions || 0,
      activeWorkflows: activeWorkflows || 0,
      completedToday: completedToday || 0,
      failedToday: failedToday || 0,
      pendingActions: pendingActions || 0,
      pendingJobs: pendingJobs || 0,
    });
  } catch (error: any) {
    console.error('Error fetching workflow stats:', error);
    return res.status(500).json({ message: error.message });
  }
}
