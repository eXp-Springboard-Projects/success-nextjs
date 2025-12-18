import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmationModal from '../../../components/admin/ConfirmationModal';
import styles from './Cache.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function CacheManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cacheStats, setCacheStats] = useState({ size: '0 MB', entries: 0, lastCleared: '' });
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/admin');
      return;
    }
    fetchCacheStats();
  }, [session]);

  const fetchCacheStats = async () => {
    try {
      const res = await fetch('/api/admin/devops/cache/stats');
      if (res.ok) {
        const data = await res.json();
        setCacheStats(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/admin/devops/cache/clear', { method: 'POST' });
      if (res.ok) {
        alert('✓ Cache cleared successfully!');
        fetchCacheStats();
      } else {
        alert('✗ Failed to clear cache');
      }
    } catch (error) {
      alert('✗ Failed to clear cache');
    } finally {
      setClearing(false);
      setShowClearModal(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading cache management...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Cache Management</h1>
            <p className={styles.subtitle}>Monitor and manage application cache</p>
          </div>
          <button
            className={styles.clearButton}
            onClick={() => setShowClearModal(true)}
            disabled={clearing}
          >
            {clearing ? '⟳ Clearing...' : '🗑️ Clear All Cache'}
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💾</div>
            <div className={styles.statValue}>{cacheStats.size}</div>
            <div className={styles.statLabel}>Cache Size</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statValue}>{cacheStats.entries.toLocaleString()}</div>
            <div className={styles.statLabel}>Cached Entries</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🕒</div>
            <div className={styles.statValue}>
              {cacheStats.lastCleared ? new Date(cacheStats.lastCleared).toLocaleDateString() : 'Never'}
            </div>
            <div className={styles.statLabel}>Last Cleared</div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>About Cache Management</h2>
          <div className={styles.infoBox}>
            <p>
              <strong>What happens when you clear the cache?</strong>
            </p>
            <ul>
              <li>All cached pages and API responses will be removed</li>
              <li>The site may load slower temporarily while the cache rebuilds</li>
              <li>This can help resolve issues with stale or incorrect data</li>
              <li>The cache will automatically rebuild as users visit pages</li>
            </ul>
            <p className={styles.warning}>
              ⚠️ <strong>Warning:</strong> Clearing the cache will temporarily slow down the site.
              Only clear the cache if you're experiencing issues or after major content updates.
            </p>
          </div>
        </div>
      </div>

      {/* Clear Cache Confirmation */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearCache}
        title="Clear All Cache"
        message="⚠️ This will slow down the site temporarily while the cache rebuilds. Continue?"
        confirmText="Clear Cache"
        confirmationType="medium"
        impact="This will affect site performance for 5-10 minutes"
        actionType="caution"
        lastPerformedDate={cacheStats.lastCleared ? new Date(cacheStats.lastCleared).toLocaleDateString() : undefined}
      />
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
