import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import { StatCard, IllustrationCard, ModernCard } from '@/components/admin/shared/ModernCard';
import { Users, UserPlus, TrendingDown, DollarSign, Gift } from 'lucide-react';
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
        {/* Modern Stats Grid */}
        <div className={styles.modernGrid}>
          {/* Featured Card */}
          <div className={styles.gridFeatured}>
            <IllustrationCard
              title="SUCCESS+ Premium"
              description="Manage your subscription members"
              gradient="purple"
              size="wide"
            />
          </div>

          {/* Stat Cards */}
          <StatCard
            icon={<Users size={24} />}
            label="Active Members"
            value={loading ? '...' : stats.activeMembers.toLocaleString()}
            change="+8% this month"
            changeType="positive"
            gradient="blue"
          />

          <StatCard
            icon={<UserPlus size={24} />}
            label="New This Month"
            value={loading ? '...' : stats.newMembersThisMonth}
            change="Growing"
            changeType="positive"
            gradient="purple"
          />

          <StatCard
            icon={<TrendingDown size={24} />}
            label="Churn Rate"
            value={loading ? '...' : `${stats.churnRate.toFixed(1)}%`}
            change={stats.churnRate > 5 ? 'Needs attention' : 'Good'}
            changeType={stats.churnRate > 5 ? 'negative' : 'positive'}
            gradient="orange"
          />

          <StatCard
            icon={<DollarSign size={24} />}
            label="Monthly Recurring Revenue"
            value={loading ? '...' : `$${stats.monthlyRecurringRevenue.toLocaleString()}`}
            change="+12% growth"
            changeType="positive"
            gradient="pink"
          />

          <StatCard
            icon={<Gift size={24} />}
            label="Active Trials"
            value={loading ? '...' : stats.activeTrials}
            change={`${stats.totalTrials} total trials`}
            changeType="neutral"
            gradient="blue"
          />
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

        {/* Content Management */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Content Management</h2>
          <p className={styles.sectionDescription}>
            Manage SUCCESS+ content, courses, events, and member resources
          </p>
          <div className={styles.actionsGrid}>
            <Link href="/admin/success-plus/courses" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎓</div>
              <div className={styles.actionTitle}>Courses Manager</div>
              <div className={styles.actionDescription}>
                Add and manage courses, lessons, and modules
              </div>
            </Link>

            <Link href="/admin/resources" className={styles.actionCard}>
              <div className={styles.actionIcon}>📚</div>
              <div className={styles.actionTitle}>Resource Library</div>
              <div className={styles.actionDescription}>
                Upload PDFs, docs, and manage downloadable resources
              </div>
            </Link>

            <Link href="/admin/success-plus/events" className={styles.actionCard}>
              <div className={styles.actionIcon}>📅</div>
              <div className={styles.actionTitle}>Events Manager</div>
              <div className={styles.actionDescription}>
                Create webinars, workshops, and member events
              </div>
            </Link>

            <Link href="/admin/success-plus/shop" className={styles.actionCard}>
              <div className={styles.actionIcon}>🛍️</div>
              <div className={styles.actionTitle}>Shop Manager</div>
              <div className={styles.actionDescription}>
                Manage products, pricing, and inventory
              </div>
            </Link>

            <Link href="/admin/success-plus/help" className={styles.actionCard}>
              <div className={styles.actionIcon}>❓</div>
              <div className={styles.actionTitle}>Help Center</div>
              <div className={styles.actionDescription}>
                Manage FAQs, guides, and support articles
              </div>
            </Link>

            <Link href="/admin/success-plus/community" className={styles.actionCard}>
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>Community Manager</div>
              <div className={styles.actionDescription}>
                Moderate discussions and manage forums
              </div>
            </Link>

            <Link href="/admin/magazine-manager" className={styles.actionCard}>
              <div className={styles.actionIcon}>📖</div>
              <div className={styles.actionTitle}>Magazine Issues</div>
              <div className={styles.actionDescription}>
                Manage digital magazine content
              </div>
            </Link>

            <Link href="/dashboard" className={styles.actionCard}>
              <div className={styles.actionIcon}>👁️</div>
              <div className={styles.actionTitle}>Preview Member View</div>
              <div className={styles.actionDescription}>
                See the member dashboard experience
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
