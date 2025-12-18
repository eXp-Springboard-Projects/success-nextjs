import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get SEO settings (create default if doesn't exist)
      let seoSettings = await prisma.seo_settings.findFirst();

      if (!seoSettings) {
        seoSettings = await prisma.seo_settings.create({
          data: {
            id: randomUUID(),
            updatedAt: new Date(),
          },
        });
      }

      return res.status(200).json(seoSettings);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch SEO settings' });
    }
  }

  if (req.method === 'PUT') {
    try {
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
      let seoSettings = await prisma.seo_settings.findFirst();

      if (seoSettings) {
        // Update existing
        seoSettings = await prisma.seo_settings.update({
          where: { id: seoSettings.id },
          data: {
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
          },
        });
      } else {
        // Create new
        seoSettings = await prisma.seo_settings.create({
          data: {
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
            updatedAt: new Date(),
          },
        });
      }

      return res.status(200).json({ success: true, data: seoSettings });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save SEO settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
