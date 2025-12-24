import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '../../../../lib/supabase';

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

    const {
      department,
      type,
      userId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const supabase = supabaseAdmin();

    // Build query
    let query = supabase
      .from('staff_activity_feed')
      .select('*', { count: 'exact' });

    if (department && department !== 'all') {
      query = query.eq('department', department);
    }

    if (type) {
      query = query.eq('entity_type', type);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate as string).toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', new Date(endDate as string).toISOString());
    }

    // Fetch activities with pagination
    const { data: activities, error, count: total } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limitNum - 1);

    if (error) {
      throw error;
    }

    const response = {
      activities: (activities || []).map(activity => ({
        id: activity.id,
        userName: activity.user_name,
        action: activity.action,
        description: activity.description,
        entityType: activity.entity_type,
        department: activity.department,
        createdAt: activity.created_at,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limitNum),
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
