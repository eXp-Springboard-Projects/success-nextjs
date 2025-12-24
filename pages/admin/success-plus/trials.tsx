import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

interface TrialUser {
  id: string;
  name: string;
  email: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number;
  status: 'Active' | 'Expired' | 'Converted';
  membershipTier: string;
  membershipStatus: string;
}

interface TrialStats {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedTrials: number;
  conversionRate: number;
  trialUsers: TrialUser[];
}

export default function TrialUsersPage() {
  const [stats, setStats] = useState<TrialStats>({
    totalTrials: 0,
    activeTrials: 0,
    expiredTrials: 0,
    convertedTrials: 0,
    conversionRate: 0,
    trialUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'converted'>('all');

  useEffect(() => {
    fetch('/api/admin/success-plus/trials')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  const filteredUsers = stats.trialUsers.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'active') return user.status === 'Active';
    if (filter === 'expired') return user.status === 'Expired';
    if (filter === 'converted') return user.status === 'Converted';
    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return styles.statusPublished;
      case 'Expired':
        return styles.statusDraft;
      case 'Converted':
        return styles.badgeInsider;
      default:
        return styles.statusPending;
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Trial Users"
      description="Track and manage SUCCESS+ trial users and conversions"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total Trials</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.totalTrials.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active Trials</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeTrials}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Expired (Not Converted)</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.expiredTrials}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎉</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Converted to Paid</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.convertedTrials}
              </div>
            </div>
          </div>

          <div className={`${styles.statCard} ${stats.conversionRate < 30 ? styles.statCardWarning : ''}`}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Conversion Rate</div>
              <div className={styles.statValue}>
                {loading ? '...' : `${stats.conversionRate}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Trial Users Table */}
        <div className={styles.section}>
          <div className={styles.contentHeader}>
            <h2 className={styles.sectionTitle}>Trial Users</h2>
            <div className={styles.filterBar}>
              <div className={styles.filterGroup}>
                <label>Filter:</label>
                <select
                  className={styles.filterSelect}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All ({stats.totalTrials})</option>
                  <option value="active">Active ({stats.activeTrials})</option>
                  <option value="expired">Expired ({stats.expiredTrials})</option>
                  <option value="converted">Converted ({stats.convertedTrials})</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.contentTable}>
            {loading ? (
              <div className={styles.loading}>Loading trial users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎁</div>
                <div>No trial users found</div>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Trial Started</th>
                    <th>Trial Ends</th>
                    <th>Days Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                      </td>
                      <td>{user.email}</td>
                      <td className={styles.dateCell}>
                        {user.trialStartedAt
                          ? new Date(user.trialStartedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td className={styles.dateCell}>
                        {user.trialEndsAt
                          ? new Date(user.trialEndsAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td>
                        {user.status === 'Expired' || user.status === 'Converted' ? (
                          <span style={{ color: '#9ca3af' }}>Expired</span>
                        ) : user.daysRemaining === 0 ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Expires Today</span>
                        ) : user.daysRemaining <= 2 ? (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                            {user.daysRemaining} {user.daysRemaining === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span>
                            {user.daysRemaining} {user.daysRemaining === 1 ? 'day' : 'days'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(user.status)}>{user.status}</span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/admin/members?email=${user.email}`}
                            className={styles.actionButton}
                          >
                            View Profile
                          </Link>
                          {user.status === 'Active' && (
                            <button
                              className={styles.actionButton}
                              onClick={() => {
                                // TODO: Implement send reminder email
                                alert(`Send reminder to ${user.email}`);
                              }}
                            >
                              Send Reminder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
