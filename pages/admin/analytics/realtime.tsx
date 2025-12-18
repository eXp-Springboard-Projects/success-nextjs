import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './realtime.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function RealtimeAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/stats?period=${period}`);
      if (response.ok) {
        const analytics = await response.json();
        setData(analytics);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading analytics...</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className={styles.error}>Failed to load analytics data</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Real-Time Analytics</h1>
          <div className={styles.periodSelector}>
            <button
              className={period === '24h' ? styles.active : ''}
              onClick={() => setPeriod('24h')}
            >
              24 Hours
            </button>
            <button
              className={period === '7d' ? styles.active : ''}
              onClick={() => setPeriod('7d')}
            >
              7 Days
            </button>
            <button
              className={period === '30d' ? styles.active : ''}
              onClick={() => setPeriod('30d')}
            >
              30 Days
            </button>
            <button
              className={period === '90d' ? styles.active : ''}
              onClick={() => setPeriod('90d')}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Views</div>
            <div className={styles.statValue}>{data.overview.totalViews.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unique Visitors</div>
            <div className={styles.statValue}>{data.overview.uniqueVisitors.toLocaleString()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg. Time on Page</div>
            <div className={styles.statValue}>{data.overview.avgTimeOnPage}s</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Bounce Rate</div>
            <div className={styles.statValue}>{data.overview.bounceRate}%</div>
          </div>
        </div>

        {/* Views Chart */}
        <div className={styles.chartCard}>
          <h2>Page Views Over Time</h2>
          <div className={styles.chart}>
            {data.viewsChart.map((point: any) => (
              <div key={point.date} className={styles.chartBar}>
                <div
                  className={styles.chartBarFill}
                  style={{
                    height: `${(point.views / Math.max(...data.viewsChart.map((p: any) => p.views))) * 100}%`,
                  }}
                />
                <div className={styles.chartLabel}>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.twoColumn}>
          {/* Top Pages */}
          <div className={styles.card}>
            <h2>Top Pages</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Unique</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((page: any) => (
                  <tr key={page.page}>
                    <td>
                      <div className={styles.pageTitle}>{page.title}</div>
                      <div className={styles.pageUrl}>{page.page}</div>
                    </td>
                    <td>{page.views.toLocaleString()}</td>
                    <td>{page.uniqueVisitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Referrers */}
          <div className={styles.card}>
            <h2>Top Referrers</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Visits</th>
                </tr>
              </thead>
              <tbody>
                {data.topReferrers.map((ref: any) => (
                  <tr key={ref.domain}>
                    <td>{ref.domain}</td>
                    <td>{ref.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.twoColumn}>
          {/* Devices */}
          <div className={styles.card}>
            <h2>Devices</h2>
            <div className={styles.breakdown}>
              {Object.entries(data.devices).map(([device, count]) => {
                const total = Object.values(data.devices).reduce((a: number, b) => a + (b as number), 0);
                return (
                  <div key={device} className={styles.breakdownItem}>
                    <div className={styles.breakdownLabel}>
                      <span className={styles.capitalize}>{device}</span>
                    </div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{
                          width: `${((count as number) / total) * 100}%`,
                        }}
                      />
                    </div>
                    <div className={styles.breakdownValue}>{(count as number).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browsers */}
          <div className={styles.card}>
            <h2>Browsers</h2>
            <div className={styles.breakdown}>
              {Object.entries(data.browsers).map(([browser, count]) => {
                const total = Object.values(data.browsers).reduce((a: number, b) => a + (b as number), 0);
                return (
                  <div key={browser} className={styles.breakdownItem}>
                    <div className={styles.breakdownLabel}>{browser}</div>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{
                          width: `${((count as number) / total) * 100}%`,
                        }}
                      />
                    </div>
                    <div className={styles.breakdownValue}>{(count as number).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
