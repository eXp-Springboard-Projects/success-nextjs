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
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>SUCCESS+ Dashboard</h1>
            <p className={styles.subtitle}>Manage subscriptions and member content</p>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>
              Active Members
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : stats.activeMembers.toLocaleString()}
            </div>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>
              New This Month
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : stats.newMembersThisMonth.toLocaleString()}
            </div>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>
              MRR
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : `$${stats.monthlyRecurringRevenue.toLocaleString()}`}
            </div>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>
              Active Trials
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : stats.activeTrials.toLocaleString()}
            </div>
          </div>

          <div className={styles.statDivider}></div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>
              Churn Rate
            </div>
            <div className={styles.statValue}>
              {loading ? '...' : `${stats.churnRate.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mainSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
            </div>
            <div className={styles.actionsList}>
              <Link href="/admin/success-plus/trials" className={styles.actionItem}>
                <div className={styles.actionIconWrapper}>
                  <Gift className={styles.actionIcon} size={16} />
                </div>
                <div className={styles.actionContent}>
                  <p className={styles.actionLabel}>Trial Users</p>
                  <p className={styles.actionDesc}>Track and convert trial users ({stats.activeTrials} active)</p>
                </div>
                <svg className={styles.actionChevron} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link href="/admin/success-plus/subscribers" className={styles.actionItem}>
                <div className={styles.actionIconWrapper}>
                  <Users className={styles.actionIcon} size={16} />
                </div>
                <div className={styles.actionContent}>
                  <p className={styles.actionLabel}>SUCCESS+ Subscribers</p>
                  <p className={styles.actionDesc}>View and manage all SUCCESS+ members</p>
                </div>
                <svg className={styles.actionChevron} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link href="/admin/success-plus/tiers" className={styles.actionItem}>
                <div className={styles.actionIconWrapper}>
                  <DollarSign className={styles.actionIcon} size={16} />
                </div>
                <div className={styles.actionContent}>
                  <p className={styles.actionLabel}>Manage Tiers</p>
                  <p className={styles.actionDesc}>Edit pricing and tier features</p>
                </div>
                <svg className={styles.actionChevron} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>

              <Link href="/admin/content-viewer?filter=premium" className={styles.actionItem}>
                <div className={styles.actionIconWrapper}>
                  <UserPlus className={styles.actionIcon} size={16} />
                </div>
                <div className={styles.actionContent}>
                  <p className={styles.actionLabel}>Premium Content</p>
                  <p className={styles.actionDesc}>Manage articles and resources for SUCCESS+ members</p>
                </div>
                <svg className={styles.actionChevron} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
          </div>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Users size={20} />
              </div>
              <p className={styles.emptyText}>Loading activity...</p>
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Users size={20} />
              </div>
              <p className={styles.emptyText}>No recent member activity</p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityRow}>
                  <div className={styles.activityContent}>
                    <p className={styles.activityLabel}>{activity.description}</p>
                    <p className={styles.activityMeta}>
                      {activity.user && `${activity.user} • `}
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
