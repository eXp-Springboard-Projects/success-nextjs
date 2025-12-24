import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admins can view subscribers
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      const {
        type,
        recipientType,
        isComplimentary,
        status,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('subscribers')
        .select(`
          *,
          member:members(
            id,
            firstName,
            lastName,
            email,
            membershipTier
          )
        `, { count: 'exact' });

      // Filter by subscription type
      if (type && type !== 'all') {
        query = query.eq('type', type as string);
      }

      // Filter by recipient type
      if (recipientType && recipientType !== 'all') {
        query = query.eq('recipientType', recipientType as string);
      }

      // Filter by complimentary status
      if (isComplimentary === 'true') {
        query = query.eq('isComplimentary', true);
      } else if (isComplimentary === 'false') {
        query = query.eq('isComplimentary', false);
      }

      // Filter by status
      if (status && status !== 'all') {
        query = query.eq('status', status as string);
      }

      // Search by email or name
      if (search) {
        query = query.or(`email.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%`);
      }

      const { data: subscribers, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (error) throw error;

      return res.status(200).json({
        subscribers,
        total: count || 0,
        page: pageNum,
        totalPages: Math.ceil((count || 0) / limitNum),
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch subscribers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        email,
        firstName,
        lastName,
        type,
        recipientType,
        isComplimentary,
        source,
      } = req.body;

      // Check if subscriber already exists
      const { data: existing, error: existingError } = await supabase
        .from('subscribers')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return res.status(400).json({ message: 'Subscriber already exists' });
      }

      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .insert({
          email,
          firstName,
          lastName,
          type: type || 'EmailNewsletter',
          recipientType: recipientType || 'Customer',
          isComplimentary: isComplimentary || false,
          source: source || 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(subscriber);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create subscriber' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
