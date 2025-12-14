import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Cache.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function CacheManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // No client-side redirects needed
  }, [status, session, router]);

  const handlePurgeCache = async (type: string) => {
    setPurging(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cache/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `${type} cache purged successfully!` });
      } else {
        throw new Error('Failed to purge cache');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to purge cache. Please try again.' });
    } finally {
      setPurging(false);
    }
  };

  if (status === 'loading') {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Cache Management</h1>
            <p className={styles.subtitle}>Manage caching and CDN for optimal performance</p>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* WP Engine Cache Controls */}
        <div className={styles.section}>
          <h2>🚀 WP Engine Cache Controls</h2>
          <p className={styles.description}>
            Clear cached content to ensure visitors see the latest version of your site.
          </p>

          <div className={styles.cacheGrid}>
            <div className={styles.cacheCard}>
              <div className={styles.cacheIcon}>🌐</div>
              <h3>Purge All Cache</h3>
              <p>Clear all cached pages and assets across the entire site</p>
              <button
                onClick={() => handlePurgeCache('all')}
                disabled={purging}
                className={styles.purgeButton}
              >
                {purging ? 'Purging...' : 'Purge All Cache'}
              </button>
            </div>

            <div className={styles.cacheCard}>
              <div className={styles.cacheIcon}>📄</div>
              <h3>Purge Page Cache</h3>
              <p>Clear cached HTML pages only</p>
              <button
                onClick={() => handlePurgeCache('pages')}
                disabled={purging}
                className={styles.purgeButton}
              >
                {purging ? 'Purging...' : 'Purge Page Cache'}
              </button>
            </div>

            <div className={styles.cacheCard}>
              <div className={styles.cacheIcon}>🖼️</div>
              <h3>Purge CDN Cache</h3>
              <p>Clear CDN cached assets (images, CSS, JS)</p>
              <button
                onClick={() => handlePurgeCache('cdn')}
                disabled={purging}
                className={styles.purgeButton}
              >
                {purging ? 'Purging...' : 'Purge CDN Cache'}
              </button>
            </div>

            <div className={styles.cacheCard}>
              <div className={styles.cacheIcon}>⚡</div>
              <h3>Purge Object Cache</h3>
              <p>Clear database query cache</p>
              <button
                onClick={() => handlePurgeCache('object')}
                disabled={purging}
                className={styles.purgeButton}
              >
                {purging ? 'Purging...' : 'Purge Object Cache'}
              </button>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className={styles.section}>
          <h2>📊 Cache Status</h2>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Page Cache</span>
              <span className={styles.statusActive}>● Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Object Cache</span>
              <span className={styles.statusActive}>● Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>CDN</span>
              <span className={styles.statusActive}>● Active</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Browser Cache</span>
              <span className={styles.statusActive}>● Active</span>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className={styles.section}>
          <h2>⚙️ Performance Settings</h2>

          <div className={styles.settingsList}>
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Enable Page Cache</h3>
                <p>Cache full HTML pages for faster loading</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Enable Object Cache</h3>
                <p>Cache database queries using Redis</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Enable CDN</h3>
                <p>Serve static assets from CDN edge locations</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Minify CSS/JS</h3>
                <p>Compress CSS and JavaScript files</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Image Optimization</h3>
                <p>Automatically optimize images with Imagify</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <h3>Lazy Load Images</h3>
                <p>Load images only when they enter the viewport</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        {/* WP Engine Quick Links */}
        <div className={styles.section}>
          <h2>🔗 WP Engine Portal</h2>
          <div className={styles.quickLinks}>
            <a href="https://my.wpengine.com" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
              <span className={styles.linkIcon}>🏠</span>
              <span>WP Engine Dashboard</span>
            </a>
            <a href="https://my.wpengine.com/staging" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
              <span className={styles.linkIcon}>🔧</span>
              <span>Staging Environment</span>
            </a>
            <a href="https://my.wpengine.com/backups" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
              <span className={styles.linkIcon}>💾</span>
              <span>Backups</span>
            </a>
            <a href="https://my.wpengine.com/performance" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
              <span className={styles.linkIcon}>📈</span>
              <span>Performance Reports</span>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
