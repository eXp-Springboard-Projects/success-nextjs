import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { hasDepartmentAccess } from '@/lib/departmentAuth';
import { Department } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.COACHING)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Return stub data
    const stats = {
      activeClients: 0,
      sessionsThisWeek: 0,
      programsRunning: 0,
      coachUtilization: 0,
      todaysSessions: []
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
