import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getPodcast(req, res, id);
    case 'PUT':
      return updatePodcast(req, res, id);
    case 'DELETE':
      return deletePodcast(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPodcast(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { data: podcast, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    return res.status(200).json(podcast);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePodcast(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { title, slug, description, audioUrl, thumbnail, duration, status, publishedAt } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (description) updateData.description = description;
    if (audioUrl) updateData.audio_url = audioUrl;
    if (thumbnail) updateData.thumbnail = thumbnail;
    if (duration) updateData.duration = duration;
    if (status) updateData.status = status.toUpperCase();
    if (publishedAt) updateData.published_at = new Date(publishedAt).toISOString();

    const { data: podcast, error } = await supabase
      .from('podcasts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating podcast:', error);
      return res.status(500).json({ message: 'Failed to update podcast' });
    }

    return res.status(200).json(podcast);
  } catch (error) {
    console.error('Error updating podcast:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deletePodcast(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { error } = await supabase
      .from('podcasts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting podcast:', error);
      return res.status(500).json({ message: 'Failed to delete podcast' });
    }

    return res.status(200).json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
