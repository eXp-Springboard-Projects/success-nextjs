import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Dev.module.css';

interface DashboardStats {
  systemHealth: 'healthy' | 'warning' | 'critical';
  errorRate24h: number;
  recentDeployments: Array<{
    id: string;
    version: string;
    status: string;
    deployedAt: string;
    deployedBy: string;
  }>;
  errorLogs: Array<{
    id: string;
    errorType: string;
    message: string;
    severity: string;
    timestamp: string;
  }>;
  activeFeatureFlags: number;
  totalFeatureFlags: number;
  webhookFailures24h: number;
  cacheStatus: string;
}

export default function DevDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    systemHealth: 'healthy',
    errorRate24h: 0,
    recentDeployments: [],
    errorLogs: [],
    activeFeatureFlags: 0,
    totalFeatureFlags: 0,
    webhookFailures24h: 0,
    cacheStatus: 'Unknown',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dev/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✕';
      default: return '?';
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.DEV}
      pageTitle="Dev Dashboard"
      description="System monitoring and technical tools"
    >
      <div className={styles.dashboard}>
        {/* System Health Overview */}
        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <h2>System Health Status</h2>
            <div className={styles.healthIndicator} style={{ background: getHealthColor(stats.systemHealth) }}>
              <span className={styles.healthIcon}>{getHealthIcon(stats.systemHealth)}</span>
              <span className={styles.healthText}>{stats.systemHealth.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${stats.errorRate24h > 5 ? styles.statCardWarning : ''}`}>
            <div className={styles.statIcon}>⚠️</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Error Rate (24h)</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.errorRate24h.toFixed(2)}%`}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚀</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Recent Deployments</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.recentDeployments.length}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚩</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Feature Flags</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.activeFeatureFlags}/${stats.totalFeatureFlags}`}
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.webhookFailures24h > 0 ? styles.statCardWarning : ''}`}>
            <div className={styles.statIcon}>🔌</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Webhook Failures (24h)</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.webhookFailures24h}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/site-monitor" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>System Status</div>
              <div className={styles.actionDescription}>
                View detailed system health metrics
              </div>
            </Link>

            <Link href="/admin/devops/error-logs" className={styles.actionCard}>
              <div className={styles.actionIcon}>📋</div>
              <div className={styles.actionTitle}>Error Logs</div>
              <div className={styles.actionDescription}>
                Review and resolve system errors
              </div>
            </Link>

            <div className={styles.actionCardDisabled}>
              <div className={styles.comingSoonBadge}>Coming Soon</div>
              <div className={styles.actionIcon}>🚩</div>
              <div className={styles.actionTitle}>Feature Flags</div>
              <div className={styles.actionDescription}>
                Toggle features on/off
              </div>
            </div>

            <Link href="/admin/devops/cache" className={styles.actionCard}>
              <div className={styles.actionIcon}>💾</div>
              <div className={styles.actionTitle}>Cache Management</div>
              <div className={styles.actionDescription}>
                Clear caches and view cache stats
              </div>
            </Link>

            <div className={styles.actionCardDisabled}>
              <div className={styles.comingSoonBadge}>Coming Soon</div>
              <div className={styles.actionIcon}>🔌</div>
              <div className={styles.actionTitle}>Webhooks</div>
              <div className={styles.actionDescription}>
                Monitor webhook events and retries
              </div>
            </div>

            <div className={styles.actionCardDisabled}>
              <div className={styles.comingSoonBadge}>Coming Soon</div>
              <div className={styles.actionIcon}>🚀</div>
              <div className={styles.actionTitle}>Deployments</div>
              <div className={styles.actionDescription}>
                View deployment history
              </div>
            </div>
          </div>
        </div>

        <div className={styles.twoColumn}>
          {/* Recent Deployments */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Deployments</h2>
            <div className={styles.deploymentsList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.recentDeployments.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🚀</div>
                  <div>No recent deployments</div>
                </div>
              ) : (
                stats.recentDeployments.map((deployment) => (
                  <div key={deployment.id} className={styles.deploymentItem}>
                    <div className={`${styles.deploymentStatus} ${styles[`status${deployment.status}`]}`}>
                      {deployment.status === 'SUCCESS' ? '✓' : deployment.status === 'FAILED' ? '✕' : '⏳'}
                    </div>
                    <div className={styles.deploymentContent}>
                      <div className={styles.deploymentVersion}>{deployment.version}</div>
                      <div className={styles.deploymentMeta}>
                        {deployment.deployedBy} · {new Date(deployment.deployedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Errors */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Errors</h2>
            <div className={styles.errorsList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.errorLogs.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>✓</div>
                  <div>No recent errors</div>
                </div>
              ) : (
                stats.errorLogs.map((error) => (
                  <div key={error.id} className={styles.errorItem}>
                    <div className={`${styles.severityBadge} ${styles[`severity${error.severity}`]}`}>
                      {error.severity}
                    </div>
                    <div className={styles.errorContent}>
                      <div className={styles.errorType}>{error.errorType}</div>
                      <div className={styles.errorMessage}>{error.message}</div>
                      <div className={styles.errorMeta}>{new Date(error.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Services */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>System Services</h2>
          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>💾</div>
              <div className={styles.serviceName}>Database</div>
              <div className={styles.serviceStatus}>
                <span className={styles.statusDot} style={{ background: '#10b981' }}></span>
                Operational
              </div>
            </div>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>⚡</div>
              <div className={styles.serviceName}>API Server</div>
              <div className={styles.serviceStatus}>
                <span className={styles.statusDot} style={{ background: '#10b981' }}></span>
                Operational
              </div>
            </div>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>💳</div>
              <div className={styles.serviceName}>Stripe</div>
              <div className={styles.serviceStatus}>
                <span className={styles.statusDot} style={{ background: '#10b981' }}></span>
                Operational
              </div>
            </div>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>🗄️</div>
              <div className={styles.serviceName}>Cache</div>
              <div className={styles.serviceStatus}>
                <span className={styles.statusDot} style={{ background: '#10b981' }}></span>
                {stats.cacheStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.DEV);
