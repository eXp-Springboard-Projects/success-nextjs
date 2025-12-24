import { supabaseAdmin } from '../../lib/supabase';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Get settings from database
      const { data: settings, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is ok
        throw fetchError;
      }

      if (!settings) {
        // Return default settings if none exist
        return res.status(200).json({
          siteName: 'SUCCESS Magazine',
          siteDescription: 'Your Trusted Guide to the Future of Work',
          siteUrl: 'https://www.success.com',
          adminEmail: '',
          facebookUrl: '',
          twitterUrl: '',
          instagramUrl: '',
          linkedinUrl: '',
          youtubeUrl: '',
          wordpressApiUrl: 'https://successcom.wpenginepowered.com/wp-json/wp/v2',
          wordpressApiKey: '',
          defaultMetaTitle: 'SUCCESS Magazine',
          defaultMetaDescription: '',
          googleAnalyticsId: '',
          facebookPixelId: '',
        });
      }

      return res.status(200).json(settings);
    } catch (error) {
      console.error('Settings fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    const {
      siteName,
      siteDescription,
      siteUrl,
      adminEmail,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      wordpressApiUrl,
      wordpressApiKey,
      defaultMetaTitle,
      defaultMetaDescription,
      googleAnalyticsId,
      facebookPixelId,
    } = req.body;

    try {
      // Check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const settingsData = {
        siteName,
        siteDescription,
        siteUrl,
        adminEmail,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        wordpressApiUrl,
        wordpressApiKey,
        defaultMetaTitle,
        defaultMetaDescription,
        googleAnalyticsId,
        facebookPixelId,
      };

      let settings;
      if (existingSettings) {
        // Update existing settings
        const { data: updatedSettings, error: updateError } = await supabase
          .from('site_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select()
          .single();

        if (updateError) throw updateError;
        settings = updatedSettings;
      } else {
        // Create new settings
        const { data: newSettings, error: createError } = await supabase
          .from('site_settings')
          .insert(settingsData)
          .select()
          .single();

        if (createError) throw createError;
        settings = newSettings;
      }

      return res.status(200).json({
        message: 'Settings saved successfully',
        settings,
      });
    } catch (error) {
      console.error('Settings save error:', error);
      return res.status(500).json({
        message: 'Failed to save settings',
        error: error.message,
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
