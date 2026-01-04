import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', perPage = '50', action, entity, userId } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(perPage as string);
      const supabase = supabaseAdmin();

      // Check if activity_logs table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('activity_logs')
        .select('id')
        .limit(1);

      // If table doesn't exist or is empty, return empty array
      if (tableError) {
        console.log('Activity logs table not found or inaccessible:', tableError);
        return res.status(200).json({
          logs: [],
          total: 0,
          page: parseInt(page as string),
          perPage: parseInt(perPage as string),
          totalPages: 0,
          message: 'Activity logging not yet configured',
        });
      }

      // Build query
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          users (
            name,
            email,
            avatar,
            role
          )
        `, { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(skip, skip + parseInt(perPage as string) - 1);

      if (action) query = query.eq('action', action);
      if (entity) query = query.eq('entity', entity);
      if (userId) query = query.eq('userId', userId);

      const { data: logs, count: total, error } = await query;

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      return res.status(200).json({
        logs: logs || [],
        total: total || 0,
        page: parseInt(page as string),
        perPage: parseInt(perPage as string),
        totalPages: Math.ceil((total || 0) / parseInt(perPage as string)),
      });
    } catch (error: any) {
      console.error('Activity logs fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch activity logs',
        details: error?.message || 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, entity, entityId, details, ipAddress, userAgent } = req.body;
      const supabase = supabaseAdmin();

      const { data: log, error } = await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(log);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create activity log' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
