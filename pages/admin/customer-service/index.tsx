import { useEffect, useState } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './CustomerService.module.css';

interface DashboardStats {
  activeSubscriptions: number;
  openTickets: number;
  refundsToday: number;
  failedPayments: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  pendingItems: Array<{
    id: string;
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function CustomerServiceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeSubscriptions: 0,
    openTickets: 0,
    refundsToday: 0,
    failedPayments: 0,
    recentActivity: [],
    pendingItems: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customer-service/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Customer Service Dashboard"
      description="Subscription management and customer support"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💎</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Subscriptions</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeSubscriptions.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎫</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Open Tickets</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.openTickets}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💵</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Refunds Today</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.refundsToday}
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.failedPayments > 0 ? styles.statCardWarning : ''}`}>
            <div className={styles.statIcon}>⚠️</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Failed Payments</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.failedPayments}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/members" className={styles.actionCard}>
              <div className={styles.actionIcon}>🔍</div>
              <div className={styles.actionTitle}>Search User</div>
              <div className={styles.actionDescription}>
                Look up user by email or name
              </div>
            </Link>

            <Link href="/admin/subscriptions" className={styles.actionCard}>
              <div className={styles.actionIcon}>💳</div>
              <div className={styles.actionTitle}>Manage Subscriptions</div>
              <div className={styles.actionDescription}>
                View and modify subscriptions
              </div>
            </Link>

            <Link href="/admin/refunds" className={styles.actionCard}>
              <div className={styles.actionIcon}>💵</div>
              <div className={styles.actionTitle}>Process Refund</div>
              <div className={styles.actionDescription}>
                Issue full or partial refund
              </div>
            </Link>

            <Link href="/admin/sales" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>Sales & Orders</div>
              <div className={styles.actionDescription}>
                View all orders and transactions
              </div>
            </Link>

            <Link href="/admin/customer-service/disputes" className={styles.actionCard}>
              <div className={styles.actionIcon}>⚖️</div>
              <div className={styles.actionTitle}>Disputes & Chargebacks</div>
              <div className={styles.actionDescription}>
                Track and respond to payment disputes
              </div>
            </Link>

            <Link href="/admin/customer-service/subscriptions" className={styles.actionCard}>
              <div className={styles.actionIcon}>💎</div>
              <div className={styles.actionTitle}>View Subscriptions</div>
              <div className={styles.actionDescription}>
                Browse all active subscriptions
              </div>
            </Link>
          </div>
        </div>

        <div className={styles.twoColumn}>
          {/* Recent Activity */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.recentActivity.length === 0 ? (
                <div className={styles.emptyState}>No recent activity</div>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {activity.type === 'subscription' ? '💎' :
                       activity.type === 'refund' ? '💵' :
                       activity.type === 'payment' ? '💳' : '📝'}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>{activity.description}</div>
                      <div className={styles.activityMeta}>
                        {activity.user && `${activity.user} • `}
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Items */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pending Items</h2>
            <div className={styles.pendingList}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : stats.pendingItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>✅</div>
                  <div>All caught up!</div>
                </div>
              ) : (
                stats.pendingItems.map((item) => (
                  <div key={item.id} className={styles.pendingItem}>
                    <div className={`${styles.priorityBadge} ${styles[`priority${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}`]}`}>
                      {item.priority}
                    </div>
                    <div className={styles.pendingContent}>
                      <div className={styles.pendingType}>{item.type}</div>
                      <div className={styles.pendingDescription}>{item.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
