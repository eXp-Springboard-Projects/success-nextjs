import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'SOCIAL_TEAM'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error || !media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      return res.status(200).json(media);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if media exists
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', id as string)
        .single();

      if (fetchError || !media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', id as string);

      if (deleteError) {
        throw deleteError;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: 'DELETE',
          entity: 'media',
          entityId: id as string,
          details: JSON.stringify({
            filename: media.filename,
          }),
        });

      return res.status(200).json({ success: true, message: 'Media deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete media' });
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const { alt, caption } = req.body;

      const updateData: any = {};
      if (alt !== undefined) updateData.alt = alt;
      if (caption !== undefined) updateData.caption = caption;

      const { data: updatedMedia, error: updateError } = await supabase
        .from('media')
        .update(updateData)
        .eq('id', id as string)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          action: 'UPDATE',
          entity: 'media',
          entityId: id as string,
          details: JSON.stringify({
            alt,
            caption,
          }),
        });

      return res.status(200).json({
        success: true,
        media: updatedMedia,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update media' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
