import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getRequest(req, res);
  } else if (req.method === 'PUT') {
    return updateRequest(req, res, session);
  } else if (req.method === 'DELETE') {
    return deleteRequest(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { id } = req.query;

    const { data: request, error } = await supabase
      .from('social_media_requests')
      .select('*')
      .eq('id', id as string)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json(request);
  } catch (error) {
    console.error('Get request error:', error);
    return res.status(500).json({ error: 'Failed to fetch request' });
  }
}

async function updateRequest(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const { id } = req.query;
    const {
      title,
      description,
      linkUrl,
      imageUrl,
      status,
      priority,
      assignedTo,
      assignedToName,
      notes,
    } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (linkUrl !== undefined) updateData.link_url = linkUrl;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (assignedToName !== undefined) updateData.assigned_to_name = assignedToName;
    if (notes !== undefined) updateData.notes = notes;

    // If status is being changed to completed, set completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: request, error } = await supabase
      .from('social_media_requests')
      .update(updateData)
      .eq('id', id as string)
      .select()
      .single();

    if (error) {
      console.error('Update request error:', error);
      return res.status(500).json({ error: 'Failed to update request' });
    }

    return res.status(200).json(request);
  } catch (error) {
    console.error('Update request error:', error);
    return res.status(500).json({ error: 'Failed to update request' });
  }
}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { id } = req.query;

    const { error } = await supabase
      .from('social_media_requests')
      .delete()
      .eq('id', id as string);

    if (error) {
      console.error('Delete request error:', error);
      return res.status(500).json({ error: 'Failed to delete request' });
    }

    return res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
}
