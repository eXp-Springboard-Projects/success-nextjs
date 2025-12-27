import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

interface DashboardStats {
  activeMembers: number;
  newMembersThisMonth: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  activeTrials: number;
  totalTrials: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export default function SuccessPlusDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeMembers: 0,
    newMembersThisMonth: 0,
    churnRate: 0,
    monthlyRecurringRevenue: 0,
    activeTrials: 0,
    totalTrials: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/success-plus/dashboard-stats')
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
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="SUCCESS+ Dashboard"
      description="Member management and subscription analytics"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <Link href="/admin/members?status=ACTIVE" className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Members</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeMembers.toLocaleString()}
              </div>
            </div>
          </Link>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🆕</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>New This Month</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.newMembersThisMonth}
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.churnRate > 5 ? styles.statCardWarning : ''}`}>
            <div className={styles.statIcon}>📉</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Churn Rate</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.churnRate.toFixed(1)}%`}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Monthly Recurring Revenue</div>
              <div className={styles.statValue}>
                {loading ? '...' : `$${stats.monthlyRecurringRevenue.toLocaleString()}`}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Trials</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeTrials}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/success-plus/trials" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎁</div>
              <div className={styles.actionTitle}>Trial Users</div>
              <div className={styles.actionDescription}>
                Track and convert trial users ({stats.activeTrials} active)
              </div>
            </Link>

            <Link href="/admin/success-plus/subscribers" className={styles.actionCard}>
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>SUCCESS+ Subscribers</div>
              <div className={styles.actionDescription}>
                View and manage all SUCCESS+ members
              </div>
            </Link>

            <Link href="/admin/success-plus/tiers" className={styles.actionCard}>
              <div className={styles.actionIcon}>🏆</div>
              <div className={styles.actionTitle}>Manage Tiers</div>
              <div className={styles.actionDescription}>
                Edit pricing and tier features
              </div>
            </Link>

            <Link href="/admin/content-viewer?filter=premium" className={styles.actionCard}>
              <div className={styles.actionIcon}>💎</div>
              <div className={styles.actionTitle}>Premium Content</div>
              <div className={styles.actionDescription}>
                Manage articles and resources for SUCCESS+ members
              </div>
            </Link>

            <Link href="/admin/success-plus/newsletters" className={styles.actionCard}>
              <div className={styles.actionIcon}>📧</div>
              <div className={styles.actionTitle}>Newsletters</div>
              <div className={styles.actionDescription}>
                Create and send newsletters to members
              </div>
            </Link>

            <Link href="/admin/analytics?dept=success-plus" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>Analytics</div>
              <div className={styles.actionDescription}>
                View engagement and retention metrics
              </div>
            </Link>

            <Link href="/admin/subscriptions" className={styles.actionCard}>
              <div className={styles.actionIcon}>💳</div>
              <div className={styles.actionTitle}>Billing</div>
              <div className={styles.actionDescription}>
                Manage payments and subscriptions
              </div>
            </Link>

            <Link href="/admin/success-plus/manage-subscriptions" className={styles.actionCard}>
              <div className={styles.actionIcon}>⚙️</div>
              <div className={styles.actionTitle}>Manage Subscriptions</div>
              <div className={styles.actionDescription}>
                Update member tiers and renewal dates
              </div>
            </Link>
          </div>
        </div>

        {/* Member Dashboard Access */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Member Dashboard Access</h2>
          <p className={styles.sectionDescription}>
            View the member experience on mysuccessplus.com
          </p>
          <div className={styles.actionsGrid}>
            <Link href="/dashboard" className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <div className={styles.actionTitle}>Member Dashboard</div>
              <div className={styles.actionDescription}>
                View main member dashboard
              </div>
            </Link>

            <Link href="/dashboard/courses" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎓</div>
              <div className={styles.actionTitle}>Courses</div>
              <div className={styles.actionDescription}>
                See course catalog and member progress
              </div>
            </Link>

            <Link href="/dashboard/disc-profile" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎯</div>
              <div className={styles.actionTitle}>DISC Profile</div>
              <div className={styles.actionDescription}>
                View DISC assessment page
              </div>
            </Link>

            <Link href="/dashboard/resources" className={styles.actionCard}>
              <div className={styles.actionIcon}>📚</div>
              <div className={styles.actionTitle}>Resource Library</div>
              <div className={styles.actionDescription}>
                Browse downloadable resources
              </div>
            </Link>

            <Link href="/dashboard/community" className={styles.actionCard}>
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>Community</div>
              <div className={styles.actionDescription}>
                View community forums and discussions
              </div>
            </Link>

            <Link href="/dashboard/events" className={styles.actionCard}>
              <div className={styles.actionIcon}>📅</div>
              <div className={styles.actionTitle}>Events Calendar</div>
              <div className={styles.actionDescription}>
                See upcoming member events
              </div>
            </Link>

            <Link href="/dashboard/magazines" className={styles.actionCard}>
              <div className={styles.actionIcon}>📖</div>
              <div className={styles.actionTitle}>Magazine</div>
              <div className={styles.actionDescription}>
                Access digital magazine issues
              </div>
            </Link>

            <Link href="/dashboard/shop" className={styles.actionCard}>
              <div className={styles.actionIcon}>🛍️</div>
              <div className={styles.actionTitle}>Shop</div>
              <div className={styles.actionDescription}>
                View member shop with discounts
              </div>
            </Link>

            <Link href="/dashboard/help" className={styles.actionCard}>
              <div className={styles.actionIcon}>❓</div>
              <div className={styles.actionTitle}>Help Center</div>
              <div className={styles.actionDescription}>
                See help resources and FAQs
              </div>
            </Link>

            <Link href="/dashboard/billing" className={styles.actionCard}>
              <div className={styles.actionIcon}>💳</div>
              <div className={styles.actionTitle}>Billing & Orders</div>
              <div className={styles.actionDescription}>
                View billing and order history
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Member Activity</h2>
          <div className={styles.activityList}>
            {loading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : stats.recentActivity.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <div>No recent activity</div>
              </div>
            ) : (
              stats.recentActivity.map((activity) => {
                const getActivityIcon = (type: string) => {
                  switch (type) {
                    case 'signup': return '🎉';
                    case 'cancellation': return '😞';
                    case 'upgrade': return '⬆️';
                    case 'downgrade': return '⬇️';
                    case 'renewal': return '🔄';
                    default: return '📋';
                  }
                };

                return (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{getActivityIcon(activity.type)}</div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>{activity.description}</div>
                      <div className={styles.activityMeta}>
                        {activity.user && `${activity.user} • `}
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
