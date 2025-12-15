import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './SEO.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface SEOData {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;
  ogType: string;
  twitterHandle: string;
  twitterCardType: string;
  googleAnalyticsId: string;
  googleSearchConsoleCode: string;
  bingWebmasterCode: string;
  facebookDomainVerification: string;
  sitemapUrl: string;
  robotsTxt: string;
  canonicalUrl: string;
  headerScripts: string;
  footerScripts: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
}

export default function SEOManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [seoData, setSEOData] = useState<SEOData>({
    siteTitle: 'SUCCESS Magazine',
    siteDescription: 'Your Guide to Personal and Professional Growth',
    siteKeywords: 'success, business, entrepreneurship, leadership, personal development',
    ogImage: 'https://www.success.com/og-image.jpg',
    ogType: 'website',
    twitterHandle: '@successmagazine',
    twitterCardType: 'summary_large_image',
    googleAnalyticsId: '',
    googleSearchConsoleCode: '',
    bingWebmasterCode: '',
    facebookDomainVerification: '',
    sitemapUrl: '/api/sitemap.xml',
    robotsTxt: 'User-agent: *\nAllow: /',
    canonicalUrl: '',
    headerScripts: '',
    footerScripts: '',
    faviconUrl: '',
    appleTouchIconUrl: '',
  });

  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState<string[]>([]);

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSEOData();
    }
  }, [status, session]);

  useEffect(() => {
    analyzeSEO();
  }, [seoData]);

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seo');
      if (res.ok) {
        const data = await res.json();
        setSEOData({
          siteTitle: data.siteTitle || 'SUCCESS Magazine',
          siteDescription: data.siteDescription || 'Your Guide to Personal and Professional Growth',
          siteKeywords: data.siteKeywords || 'success, business, entrepreneurship, leadership, personal development',
          ogImage: data.ogImage || 'https://www.success.com/og-image.jpg',
          ogType: data.ogType || 'website',
          twitterHandle: data.twitterHandle || '@successmagazine',
          twitterCardType: data.twitterCardType || 'summary_large_image',
          googleAnalyticsId: data.googleAnalyticsId || '',
          googleSearchConsoleCode: data.googleSearchConsoleCode || '',
          bingWebmasterCode: data.bingWebmasterCode || '',
          facebookDomainVerification: data.facebookDomainVerification || '',
          sitemapUrl: data.sitemapUrl || '/api/sitemap.xml',
          robotsTxt: data.robotsTxt || 'User-agent: *\nAllow: /',
          canonicalUrl: data.canonicalUrl || '',
          headerScripts: data.headerScripts || '',
          footerScripts: data.footerScripts || '',
          faviconUrl: data.faviconUrl || '',
          appleTouchIconUrl: data.appleTouchIconUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      setMessage({ type: 'error', text: 'Failed to load SEO settings' });
    } finally {
      setLoading(false);
    }
  };

  const analyzeSEO = () => {
    let score = 100;
    const issues: string[] = [];

    if (!seoData.siteTitle || seoData.siteTitle.length < 10) {
      score -= 10;
      issues.push('Site title is too short (minimum 10 characters)');
    }
    if (seoData.siteTitle && seoData.siteTitle.length > 60) {
      score -= 5;
      issues.push('Site title is too long (maximum 60 characters)');
    }

    if (!seoData.siteDescription || seoData.siteDescription.length < 50) {
      score -= 15;
      issues.push('Site description is too short (minimum 50 characters)');
    }
    if (seoData.siteDescription && seoData.siteDescription.length > 160) {
      score -= 5;
      issues.push('Site description is too long (maximum 160 characters)');
    }

    if (!seoData.ogImage) {
      score -= 10;
      issues.push('Open Graph image is missing');
    }

    if (!seoData.googleAnalyticsId) {
      score -= 10;
      issues.push('Google Analytics not configured');
    }

    if (!seoData.googleSearchConsoleCode) {
      score -= 10;
      issues.push('Google Search Console not configured');
    }

    if (!seoData.siteKeywords) {
      score -= 5;
      issues.push('Meta keywords are empty');
    }

    setSeoScore(Math.max(0, score));
    setSeoIssues(issues);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seoData),
      });

      if (!res.ok) {
        throw new Error('Failed to save SEO settings');
      }

      setMessage({ type: 'success', text: 'SEO settings saved successfully!' });

      // Trigger revalidation of all pages to apply new SEO settings
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/' }),
      }).catch(() => {});

    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setMessage({ type: 'error', text: 'Failed to save SEO settings' });
    } finally {
      setSaving(false);
    }
  };

  const generateSitemap = async () => {
    try {
      window.open('/api/sitemap.xml', '_blank');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate sitemap' });
    }
  };

  const testGoogleIndex = () => {
    window.open(`https://www.google.com/search?q=site:${window.location.hostname}`, '_blank');
  };

  if (status === 'loading') {
    return <AdminLayout><div>Loading...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>SEO Management</h1>
          <p>Optimize your site's search engine visibility</p>
        </div>

        {/* SEO Score Dashboard */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 200 200" className={styles.scoreRing}>
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={seoScore >= 80 ? '#10b981' : seoScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="20"
                strokeDasharray={`${(seoScore / 100) * 502.65} 502.65`}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className={styles.scoreValue}>
              <span className={styles.scoreNumber}>{seoScore}</span>
              <span className={styles.scoreLabel}>/ 100</span>
            </div>
          </div>

          <div className={styles.scoreInfo}>
            <h2>SEO Health Score</h2>
            <p>
              {seoScore >= 80 ? '✅ Excellent' : seoScore >= 50 ? '⚠️ Needs Improvement' : '❌ Critical Issues'}
            </p>

            {seoIssues.length > 0 && (
              <div className={styles.issues}>
                <h3>Issues to Fix:</h3>
                <ul>
                  {seoIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Basic SEO Settings */}
        <div className={styles.section}>
          <h2>🎯 Basic SEO Settings</h2>

          <div className={styles.formGroup}>
            <label>
              Site Title
              <span className={styles.charCount}>{seoData.siteTitle.length}/60</span>
            </label>
            <input
              type="text"
              value={seoData.siteTitle}
              onChange={(e) => setSEOData({ ...seoData, siteTitle: e.target.value })}
              placeholder="SUCCESS Magazine"
              maxLength={60}
            />
            <small>Appears in search results and browser tabs</small>
          </div>

          <div className={styles.formGroup}>
            <label>
              Site Description
              <span className={styles.charCount}>{seoData.siteDescription.length}/160</span>
            </label>
            <textarea
              value={seoData.siteDescription}
              onChange={(e) => setSEOData({ ...seoData, siteDescription: e.target.value })}
              placeholder="Your Guide to Personal and Professional Growth"
              rows={3}
              maxLength={160}
            />
            <small>Meta description shown in search results</small>
          </div>

          <div className={styles.formGroup}>
            <label>Meta Keywords</label>
            <input
              type="text"
              value={seoData.siteKeywords}
              onChange={(e) => setSEOData({ ...seoData, siteKeywords: e.target.value })}
              placeholder="success, business, entrepreneurship, leadership"
            />
            <small>Comma-separated keywords (optional, not heavily weighted by search engines)</small>
          </div>
        </div>

        {/* Social Media SEO */}
        <div className={styles.section}>
          <h2>📱 Social Media & Open Graph</h2>

          <div className={styles.formGroup}>
            <label>Open Graph Image URL</label>
            <input
              type="url"
              value={seoData.ogImage}
              onChange={(e) => setSEOData({ ...seoData, ogImage: e.target.value })}
              placeholder="https://www.success.com/og-image.jpg"
            />
            <small>Image displayed when shared on social media (1200x630px recommended)</small>
          </div>

          <div className={styles.formGroup}>
            <label>Twitter Handle</label>
            <input
              type="text"
              value={seoData.twitterHandle}
              onChange={(e) => setSEOData({ ...seoData, twitterHandle: e.target.value })}
              placeholder="@successmagazine"
            />
            <small>Your Twitter/X account for Twitter Cards</small>
          </div>
        </div>

        {/* Analytics & Tracking */}
        <div className={styles.section}>
          <h2>📊 Analytics & Tracking</h2>

          <div className={styles.formGroup}>
            <label>Google Analytics ID</label>
            <input
              type="text"
              value={seoData.googleAnalyticsId}
              onChange={(e) => setSEOData({ ...seoData, googleAnalyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
            />
            <small>Track site visits and user behavior</small>
          </div>

          <div className={styles.formGroup}>
            <label>Google Search Console Verification</label>
            <input
              type="text"
              value={seoData.googleSearchConsoleCode}
              onChange={(e) => setSEOData({ ...seoData, googleSearchConsoleCode: e.target.value })}
              placeholder="google-site-verification=xxxxx"
            />
            <small>Verification code from Google Search Console</small>
          </div>

          <div className={styles.formGroup}>
            <label>Bing Webmaster Verification</label>
            <input
              type="text"
              value={seoData.bingWebmasterCode}
              onChange={(e) => setSEOData({ ...seoData, bingWebmasterCode: e.target.value })}
              placeholder="bing-webmaster-verification=xxxxx"
            />
            <small>Verification code from Bing Webmaster Tools</small>
          </div>

          <div className={styles.formGroup}>
            <label>Facebook Domain Verification</label>
            <input
              type="text"
              value={seoData.facebookDomainVerification}
              onChange={(e) => setSEOData({ ...seoData, facebookDomainVerification: e.target.value })}
              placeholder="facebook-domain-verification=xxxxx"
            />
            <small>Meta verification code for Facebook/Instagram</small>
          </div>
        </div>

        {/* Sitemap & Robots */}
        <div className={styles.section}>
          <h2>🗺️ Sitemap & Robots.txt</h2>

          <div className={styles.formGroup}>
            <label>Sitemap URL</label>
            <div className={styles.inputWithButton}>
              <input
                type="url"
                value={seoData.sitemapUrl}
                readOnly
              />
              <button onClick={generateSitemap} className={styles.secondaryButton}>
                View Sitemap
              </button>
            </div>
            <small>Automatically generated from your content</small>
          </div>

          <div className={styles.formGroup}>
            <label>Robots.txt</label>
            <textarea
              value={seoData.robotsTxt}
              onChange={(e) => setSEOData({ ...seoData, robotsTxt: e.target.value })}
              placeholder={`User-agent: *\nAllow: /\nSitemap: ${seoData.sitemapUrl}`}
              rows={5}
            />
            <small>Configure how search engines crawl your site</small>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2>⚡ Quick Actions</h2>

          <div className={styles.actionGrid}>
            <button onClick={testGoogleIndex} className={styles.actionButton}>
              <span>🔍</span>
              <span>Test Google Indexing</span>
            </button>

            <button onClick={generateSitemap} className={styles.actionButton}>
              <span>🗺️</span>
              <span>View Sitemap</span>
            </button>

            <button onClick={() => window.open('/api/rss', '_blank')} className={styles.actionButton}>
              <span>📡</span>
              <span>View RSS Feed</span>
            </button>

            <button
              onClick={() => window.open('https://search.google.com/search-console', '_blank')}
              className={styles.actionButton}
            >
              <span>📈</span>
              <span>Google Search Console</span>
            </button>

            <button
              onClick={() => window.open('https://analytics.google.com', '_blank')}
              className={styles.actionButton}
            >
              <span>📊</span>
              <span>Google Analytics</span>
            </button>

            <button
              onClick={() => window.open('https://www.google.com/webmasters/tools/submit-url', '_blank')}
              className={styles.actionButton}
            >
              <span>➕</span>
              <span>Submit URL to Google</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.footer}>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save SEO Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
