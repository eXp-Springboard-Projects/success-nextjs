import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Settings.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings
  const [siteName, setSiteName] = useState('SUCCESS Magazine');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Social Media
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // WordPress API
  const [wordpressApiUrl, setWordpressApiUrl] = useState('');
  const [wordpressApiKey, setWordpressApiKey] = useState('');

  // SEO Settings
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('');
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [facebookPixelId, setFacebookPixelId] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        // Populate form fields with saved settings
        setSiteName(data.siteName || 'SUCCESS Magazine');
        setSiteDescription(data.siteDescription || '');
        setSiteUrl(data.siteUrl || '');
        setAdminEmail(data.adminEmail || '');
        setFacebookUrl(data.facebookUrl || '');
        setTwitterUrl(data.twitterUrl || '');
        setInstagramUrl(data.instagramUrl || '');
        setLinkedinUrl(data.linkedinUrl || '');
        setYoutubeUrl(data.youtubeUrl || '');
        setWordpressApiUrl(data.wordpressApiUrl || '');
        setWordpressApiKey(data.wordpressApiKey || '');
        setDefaultMetaTitle(data.defaultMetaTitle || '');
        setDefaultMetaDescription(data.defaultMetaDescription || '');
        setGoogleAnalyticsId(data.googleAnalyticsId || '');
        setFacebookPixelId(data.facebookPixelId || '');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const settings = {
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

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        const errorData = await res.json();
        const errorMsg = errorData.hint
          ? `${errorData.message}\n\n${errorData.hint}`
          : errorData.message || 'Failed to save settings';
        alert(errorMsg);
      }
    } catch (error) {
      alert('Failed to save settings. Please check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <AdminLayout><div className={styles.loading}>Loading settings...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Site Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('general')}
            className={activeTab === 'general' ? styles.tabActive : styles.tab}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={activeTab === 'social' ? styles.tabActive : styles.tab}
          >
            Social Media
          </button>
          <button
            onClick={() => setActiveTab('wordpress')}
            className={activeTab === 'wordpress' ? styles.tabActive : styles.tab}
          >
            WordPress API
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={activeTab === 'seo' ? styles.tabActive : styles.tab}
          >
            SEO & Analytics
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.section}>
              <h2>General Settings</h2>
              <div className={styles.formGroup}>
                <label htmlFor="siteName">Site Name</label>
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="siteDescription">Site Description</label>
                <textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="siteUrl">Site URL</label>
                <input
                  id="siteUrl"
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://your-site.com"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="adminEmail">Admin Email</label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className={styles.section}>
              <h2>Social Media Links</h2>
              <div className={styles.formGroup}>
                <label htmlFor="facebookUrl">Facebook URL</label>
                <input
                  id="facebookUrl"
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="twitterUrl">Twitter URL</label>
                <input
                  id="twitterUrl"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="instagramUrl">Instagram URL</label>
                <input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="linkedinUrl">LinkedIn URL</label>
                <input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="youtubeUrl">YouTube URL</label>
                <input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/c/yourchannel"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {activeTab === 'wordpress' && (
            <div className={styles.section}>
              <h2>WordPress API Configuration</h2>
              <div className={styles.formGroup}>
                <label htmlFor="wordpressApiUrl">WordPress API URL</label>
                <input
                  id="wordpressApiUrl"
                  type="url"
                  value={wordpressApiUrl}
                  onChange={(e) => setWordpressApiUrl(e.target.value)}
                  placeholder="https://www.success.com/wp-json/wp/v2"
                  className={styles.input}
                />
                <small>The base URL for the WordPress REST API</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="wordpressApiKey">WordPress API Key (Optional)</label>
                <input
                  id="wordpressApiKey"
                  type="password"
                  value={wordpressApiKey}
                  onChange={(e) => setWordpressApiKey(e.target.value)}
                  placeholder="API key if required"
                  className={styles.input}
                />
                <small>Only needed if your WordPress API requires authentication</small>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className={styles.section}>
              <h2>SEO & Analytics</h2>
              <div className={styles.formGroup}>
                <label htmlFor="defaultMetaTitle">Default Meta Title</label>
                <input
                  id="defaultMetaTitle"
                  type="text"
                  value={defaultMetaTitle}
                  onChange={(e) => setDefaultMetaTitle(e.target.value)}
                  placeholder="SUCCESS Magazine - Your Personal Growth Platform"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="defaultMetaDescription">Default Meta Description</label>
                <textarea
                  id="defaultMetaDescription"
                  value={defaultMetaDescription}
                  onChange={(e) => setDefaultMetaDescription(e.target.value)}
                  rows={3}
                  placeholder="Discover expert advice on money, business, lifestyle, and more."
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="googleAnalyticsId">Google Analytics ID</label>
                <input
                  id="googleAnalyticsId"
                  type="text"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="facebookPixelId">Facebook Pixel ID</label>
                <input
                  id="facebookPixelId"
                  type="text"
                  value={facebookPixelId}
                  onChange={(e) => setFacebookPixelId(e.target.value)}
                  placeholder="XXXXXXXXXXXXXXX"
                  className={styles.input}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
