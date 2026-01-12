import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

const ABOUT_PAGE_ID = 'about-us-page';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  // Only staff members can manage About Us content
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email as string)
    .single();

  if (!user || userError || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  switch (req.method) {
    case 'GET':
      return getAboutContent(req, res);
    case 'PUT':
      return updateAboutContent(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAboutContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { data: content, error } = await supabase
      .from('about_page_content')
      .select('*')
      .eq('id', ABOUT_PAGE_ID)
      .single();

    if (error) {
      // If no content exists, return defaults
      if (error.code === 'PGRST116') {
        return res.status(200).json({
          id: ABOUT_PAGE_ID,
          heroVideoUrl: 'https://player.vimeo.com/video/1114343879?autoplay=1&loop=1&muted=1&background=1',
          historyItems: []
        });
      }
      throw error;
    }

    return res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching about content:', error);
    return res.status(500).json({ error: 'Failed to fetch about content' });
  }
}

async function updateAboutContent(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = supabaseAdmin();
    const { heroVideoUrl, historyItems } = req.body;

    // Validate history items structure
    if (historyItems && !Array.isArray(historyItems)) {
      return res.status(400).json({ error: 'historyItems must be an array' });
    }

    // Validate each history item has required fields
    if (historyItems) {
      for (const item of historyItems) {
        if (!item.year || !item.description) {
          return res.status(400).json({
            error: 'Each history item must have year and description'
          });
        }
      }
    }

    const { data: content, error: upsertError } = await supabase
      .from('about_page_content')
      .upsert({
        id: ABOUT_PAGE_ID,
        heroVideoUrl: heroVideoUrl || null,
        historyItems: historyItems || [],
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        userId,
        action: 'UPDATE_ABOUT_PAGE',
        entity: 'about_page_content',
        entityId: ABOUT_PAGE_ID,
        details: 'Updated About Us page content',
      });

    return res.status(200).json(content);
  } catch (error) {
    console.error('Error updating about content:', error);
    return res.status(500).json({ error: 'Failed to update about content' });
  }
}
