import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      // Get SEO settings (create default if doesn't exist)
      const { data: existingSettings } = await supabase
        .from('seo_settings')
        .select('*')
        .limit(1);

      let seoSettings = existingSettings?.[0];

      if (!seoSettings) {
        const { data: newSettings } = await supabase
          .from('seo_settings')
          .insert({
            id: randomUUID(),
          })
          .select()
          .single();
        seoSettings = newSettings;
      }

      return res.status(200).json(seoSettings);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch SEO settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const supabase = supabaseAdmin();
      const {
        siteTitle,
        siteDescription,
        siteKeywords,
        ogImage,
        ogType,
        twitterHandle,
        twitterCardType,
        googleAnalyticsId,
        googleSearchConsoleCode,
        bingWebmasterCode,
        facebookDomainVerification,
        sitemapUrl,
        robotsTxt,
        canonicalUrl,
        hreflangTags,
        schemaOrgMarkup,
        headerScripts,
        footerScripts,
        faviconUrl,
        appleTouchIconUrl,
      } = req.body;

      // Get or create SEO settings
      const { data: existingSettings } = await supabase
        .from('seo_settings')
        .select('*')
        .limit(1);

      let seoSettings = existingSettings?.[0];

      if (seoSettings) {
        // Update existing
        const { data: updatedSettings } = await supabase
          .from('seo_settings')
          .update({
            siteTitle,
            siteDescription,
            siteKeywords,
            ogImage,
            ogType,
            twitterHandle,
            twitterCardType,
            googleAnalyticsId,
            googleSearchConsoleCode,
            bingWebmasterCode,
            facebookDomainVerification,
            sitemapUrl,
            robotsTxt,
            canonicalUrl,
            hreflangTags,
            schemaOrgMarkup,
            headerScripts,
            footerScripts,
            faviconUrl,
            appleTouchIconUrl,
          })
          .eq('id', seoSettings.id)
          .select()
          .single();
        seoSettings = updatedSettings;
      } else {
        // Create new
        const { data: newSettings } = await supabase
          .from('seo_settings')
          .insert({
            id: randomUUID(),
            siteTitle,
            siteDescription,
            siteKeywords,
            ogImage,
            ogType,
            twitterHandle,
            twitterCardType,
            googleAnalyticsId,
            googleSearchConsoleCode,
            bingWebmasterCode,
            facebookDomainVerification,
            sitemapUrl,
            robotsTxt,
            canonicalUrl,
            hreflangTags,
            schemaOrgMarkup,
            headerScripts,
            footerScripts,
            faviconUrl,
            appleTouchIconUrl,
          })
          .select()
          .single();
        seoSettings = newSettings;
      }

      return res.status(200).json({ success: true, data: seoSettings });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save SEO settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
