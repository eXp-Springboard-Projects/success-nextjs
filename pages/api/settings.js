import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get settings from database
      let settings;
      try {
        settings = await prisma.site_settings.findFirst();
      } catch (dbError) {
settings = null;
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
          wordpressApiUrl: 'https://www.success.com/wp-json/wp/v2',
          wordpressApiKey: '',
          defaultMetaTitle: 'SUCCESS Magazine',
          defaultMetaDescription: '',
          googleAnalyticsId: '',
          facebookPixelId: '',
        });
      }

      return res.status(200).json(settings);
    } catch (error) {
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
      let existingSettings;
      try {
        existingSettings = await prisma.site_settings.findFirst();
      } catch (dbError) {
        return res.status(503).json({
          message: 'Database not available. Please run: npx prisma migrate dev --name add_site_settings',
          error: dbError.message,
          hint: 'You need to run database migrations first'
        });
      }

      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await prisma.site_settings.update({
          where: { id: existingSettings.id },
          data: {
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
          },
        });
      } else {
        // Create new settings
        settings = await prisma.site_settings.create({
          data: {
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
          },
        });
      }

      return res.status(200).json({
        message: 'Settings saved successfully',
        settings,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Failed to save settings. Database may not be configured.',
        error: error.message,
        hint: 'Run: npx prisma migrate dev --name add_site_settings'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
