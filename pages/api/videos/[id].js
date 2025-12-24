import { createClient } from '../../../lib/supabase-server';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getVideo(req, res, id);
    case 'PUT':
      return updateVideo(req, res, id);
    case 'DELETE':
      return deleteVideo(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getVideo(req, res, id) {
  const supabase = createClient(req, res);

  try {
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    return res.status(200).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateVideo(req, res, id) {
  const supabase = createClient(req, res);

  try {
    const { title, slug, description, videoUrl, thumbnail, duration, status, publishedAt } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (description) updateData.description = description;
    if (videoUrl) updateData.video_url = videoUrl;
    if (thumbnail) updateData.thumbnail = thumbnail;
    if (duration) updateData.duration = duration;
    if (status) updateData.status = status;
    if (publishedAt) updateData.published_at = new Date(publishedAt).toISOString();

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update video' });
    }

    return res.status(200).json(video);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteVideo(req, res, id) {
  const supabase = createClient(req, res);

  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete video' });
    }

    return res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
