import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './SystemHealth.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  lastCheck: string;
}

export default function SystemHealthPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/admin');
      return;
    }
    fetchMetrics();
  }, [session]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/devops/system-health');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✗';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading system health...</div>
      </AdminLayout>
    );
  }

  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>System Health Dashboard</h1>
            <p className={styles.subtitle}>Monitor system performance and service status</p>
          </div>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '⟳ Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        <div className={styles.overallStatus} style={{ borderColor: getStatusColor(overallStatus) }}>
          <div className={styles.statusIcon} style={{ color: getStatusColor(overallStatus) }}>
            {getStatusIcon(overallStatus)}
          </div>
          <div className={styles.statusInfo}>
            <h2 className={styles.statusTitle}>
              System Status: <span style={{ color: getStatusColor(overallStatus) }}>
                {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
              </span>
            </h2>
            <div className={styles.statusSummary}>
              <span className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#10b981' }}>●</span>
                {healthyCount} Healthy
              </span>
              <span className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#f59e0b' }}>●</span>
                {warningCount} Warnings
              </span>
              <span className={styles.summaryItem}>
                <span className={styles.summaryDot} style={{ background: '#ef4444' }}>●</span>
                {criticalCount} Critical
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <div key={index} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>{metric.name}</span>
                <span
                  className={styles.metricStatus}
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                >
                  {getStatusIcon(metric.status)}
                </span>
              </div>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricFooter}>
                Last check: {new Date(metric.lastCheck).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
