import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '50',
        status,
        search,
        export: exportCsv,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = supabase
        .from('sms_subscribers')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status === 'active') {
        query = query.eq('active', true);
      } else if (status === 'inactive') {
        query = query.eq('active', false);
      }

      if (search) {
        const searchTerm = `%${search}%`;
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`);
      }

      // Export to CSV
      if (exportCsv === 'csv') {
        const { data: allSubscribers, error } = await query
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Generate CSV
        const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Subscribed At', 'Resubscribed At'];
        const csv = [
          headers.join(','),
          ...(allSubscribers || []).map((sub: any) =>
            [
              sub.first_name,
              sub.last_name,
              sub.phone,
              sub.email,
              sub.active ? 'Active' : 'Inactive',
              new Date(sub.subscribed_at).toISOString(),
              sub.resubscribed_at ? new Date(sub.resubscribed_at).toISOString() : '',
            ]
              .map(field => `"${field}"`)
              .join(',')
          ),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sms-subscribers-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.status(200).send(csv);
      }

      // Regular list view
      const { data: subscribers, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) throw error;

      // Get active/inactive counts
      const { count: activeCount } = await supabase
        .from('sms_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      const { count: inactiveCount } = await supabase
        .from('sms_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('active', false);

      return res.status(200).json({
        subscribers,
        total: count || 0,
        activeCount: activeCount || 0,
        inactiveCount: inactiveCount || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum),
      });
    } catch (error: any) {
      console.error('Error fetching SMS subscribers:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch subscribers' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
