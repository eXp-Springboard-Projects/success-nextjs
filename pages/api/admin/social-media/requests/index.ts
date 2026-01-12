import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getRequests(req, res);
  } else if (req.method === 'POST') {
    return createRequest(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getRequests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { status: statusFilter, assigned_to, requested_by } = req.query;

    let query = supabase
      .from('social_media_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toString());
    }

    if (assigned_to && assigned_to !== 'all') {
      query = query.eq('assigned_to', assigned_to.toString());
    }

    if (requested_by && requested_by !== 'all') {
      query = query.eq('requested_by', requested_by.toString());
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Get requests error:', error);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

async function createRequest(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      description,
      linkUrl,
      imageUrl,
      priority = 'medium',
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: request, error } = await supabase
      .from('social_media_requests')
      .insert({
        id: randomUUID(),
        title,
        description: description || '',
        link_url: linkUrl || null,
        image_url: imageUrl || null,
        priority,
        status: 'pending',
        requested_by: session.user.id,
        requested_by_name: session.user.name || session.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create request error:', error);
      return res.status(500).json({ error: 'Failed to create request' });
    }

    return res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ error: 'Failed to create request' });
  }
}
