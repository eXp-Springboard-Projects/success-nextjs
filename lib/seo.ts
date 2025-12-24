import { supabaseAdmin } from './supabase';

export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;
  ogType: string;
  twitterHandle: string;
  twitterCardType: string;
  googleAnalyticsId?: string | null;
  googleSearchConsoleCode?: string | null;
  bingWebmasterCode?: string | null;
  facebookDomainVerification?: string | null;
  sitemapUrl: string;
  robotsTxt: string;
  canonicalUrl?: string | null;
  headerScripts?: string | null;
  footerScripts?: string | null;
  faviconUrl?: string | null;
  appleTouchIconUrl?: string | null;
}

let cachedSEOSettings: SEOSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSEOSettings(): Promise<SEOSettings> {
  // Return cached settings if still valid
  const now = Date.now();
  if (cachedSEOSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSEOSettings;
  }

  try {
    const supabase = supabaseAdmin();

    const { data: settings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !settings) {
      // Create default settings if none exist
      const { data: newSettings, error: createError } = await supabase
        .from('seo_settings')
        .insert({
          id: 'default',
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      cachedSEOSettings = {
        siteTitle: newSettings.siteTitle,
        siteDescription: newSettings.siteDescription,
        siteKeywords: newSettings.siteKeywords,
        ogImage: newSettings.ogImage,
        ogType: newSettings.ogType,
        twitterHandle: newSettings.twitterHandle,
        twitterCardType: newSettings.twitterCardType,
        googleAnalyticsId: newSettings.googleAnalyticsId,
        googleSearchConsoleCode: newSettings.googleSearchConsoleCode,
        bingWebmasterCode: newSettings.bingWebmasterCode,
        facebookDomainVerification: newSettings.facebookDomainVerification,
        sitemapUrl: newSettings.sitemapUrl,
        robotsTxt: newSettings.robotsTxt,
        canonicalUrl: newSettings.canonicalUrl,
        headerScripts: newSettings.headerScripts,
        footerScripts: newSettings.footerScripts,
        faviconUrl: newSettings.faviconUrl,
        appleTouchIconUrl: newSettings.appleTouchIconUrl,
      };
    } else {
      cachedSEOSettings = {
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        siteKeywords: settings.siteKeywords,
        ogImage: settings.ogImage,
        ogType: settings.ogType,
        twitterHandle: settings.twitterHandle,
        twitterCardType: settings.twitterCardType,
        googleAnalyticsId: settings.googleAnalyticsId,
        googleSearchConsoleCode: settings.googleSearchConsoleCode,
        bingWebmasterCode: settings.bingWebmasterCode,
        facebookDomainVerification: settings.facebookDomainVerification,
        sitemapUrl: settings.sitemapUrl,
        robotsTxt: settings.robotsTxt,
        canonicalUrl: settings.canonicalUrl,
        headerScripts: settings.headerScripts,
        footerScripts: settings.footerScripts,
        faviconUrl: settings.faviconUrl,
        appleTouchIconUrl: settings.appleTouchIconUrl,
      };
    }

    lastFetchTime = now;
    return cachedSEOSettings;
  } catch (error) {

    // Return default settings
    return {
      siteTitle: 'SUCCESS Magazine',
      siteDescription: 'Your Guide to Personal and Professional Growth',
      siteKeywords: 'success, business, entrepreneurship, leadership, personal development',
      ogImage: 'https://www.success.com/og-image.jpg',
      ogType: 'website',
      twitterHandle: '@successmagazine',
      twitterCardType: 'summary_large_image',
      sitemapUrl: '/api/sitemap.xml',
      robotsTxt: 'User-agent: *\nAllow: /',
    };
  }
}

export function clearSEOCache() {
  cachedSEOSettings = null;
  lastFetchTime = 0;
}

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function generateMetaTags(seoSettings: SEOSettings, pageSEO?: PageSEO) {
  const title = pageSEO?.title ? `${pageSEO.title} | ${seoSettings.siteTitle}` : seoSettings.siteTitle;
  const description = pageSEO?.description || seoSettings.siteDescription;
  const keywords = pageSEO?.keywords || seoSettings.siteKeywords;
  const ogImage = pageSEO?.ogImage || seoSettings.ogImage;
  const ogType = pageSEO?.ogType || seoSettings.ogType;
  const canonicalUrl = pageSEO?.canonicalUrl || seoSettings.canonicalUrl;

  return {
    title,
    description,
    keywords,
    ogImage,
    ogType,
    canonicalUrl,
    twitterHandle: seoSettings.twitterHandle,
    twitterCardType: seoSettings.twitterCardType,
    author: pageSEO?.author,
    publishedTime: pageSEO?.publishedTime,
    modifiedTime: pageSEO?.modifiedTime,
  };
}
