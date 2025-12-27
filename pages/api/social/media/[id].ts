/**
 * Media Item API (Single)
 * DELETE /api/social/media/[id] - Delete media
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<null>>
) {
  const session: any = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid media ID' });
  }

  if (req.method === 'DELETE') {
    return handleDelete(userId, id, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleDelete(
  userId: string,
  id: string,
  res: NextApiResponse<ApiResponse<null>>
) {
  try {
    const db = supabaseAdmin();

    // Get media item to verify ownership and get file path
    const { data: media, error: fetchError } = await db
      .from('social_media_library')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !media) {
      return res.status(404).json({ success: false, error: 'Media not found' });
    }

    // Extract file path from URL
    const url = new URL(media.file_url);
    const filePath = url.pathname.split('/social-media/')[1];

    // Delete from storage
    if (filePath) {
      await db.storage.from('social-media').remove([filePath]);
    }

    // Delete from database
    const { error: deleteError } = await db
      .from('social_media_library')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
