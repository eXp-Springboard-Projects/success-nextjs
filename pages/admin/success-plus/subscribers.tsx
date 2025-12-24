import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './SuccessPlus.module.css';

interface Subscriber {
  id: string;
  name: string;
  email: string;
  membershipTier: string;
  membershipStatus: string;
  createdAt: string;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  canceledSubscribers: number;
  trialSubscribers: number;
  subscribers: Subscriber[];
}

export default function SuccessPlusSubscribers() {
  const [stats, setStats] = useState<SubscriberStats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    canceledSubscribers: 0,
    trialSubscribers: 0,
    subscribers: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'canceled' | 'trial'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/admin/members?${params}`);
      if (response.ok) {
        const data = await response.json();

        // Filter for SUCCESS+ members only
        const successPlusMembers = (data.members || []).filter(
          (member: Subscriber) =>
            member.membershipTier &&
            member.membershipTier !== 'FREE' &&
            member.membershipTier !== 'free'
        );

        const activeCount = successPlusMembers.filter((m: Subscriber) => m.membershipStatus === 'ACTIVE').length;
        const canceledCount = successPlusMembers.filter((m: Subscriber) => m.membershipStatus === 'CANCELED').length;
        const trialCount = successPlusMembers.filter((m: Subscriber) => m.trialEndsAt && new Date(m.trialEndsAt) > new Date()).length;

        setStats({
          totalSubscribers: successPlusMembers.length,
          activeSubscribers: activeCount,
          canceledSubscribers: canceledCount,
          trialSubscribers: trialCount,
          subscribers: successPlusMembers,
        });
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = stats.subscribers.filter((subscriber) => {
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'active') {
      matchesFilter = subscriber.membershipStatus === 'ACTIVE';
    } else if (filter === 'canceled') {
      matchesFilter = subscriber.membershipStatus === 'CANCELED';
    } else if (filter === 'trial') {
      matchesFilter = !!(subscriber.trialEndsAt && new Date(subscriber.trialEndsAt) > new Date());
    }

    // Apply search filter
    const matchesSearch =
      !searchQuery ||
      subscriber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className={styles.statusPublished}>Active</span>;
      case 'CANCELED':
        return <span className={styles.statusDraft}>Canceled</span>;
      case 'PAST_DUE':
        return <span className={styles.statusPending}>Past Due</span>;
      default:
        return <span className={styles.statusDraft}>{status}</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'SUCCESS_PLUS':
      case 'success_plus':
        return <span className={styles.badgePremium}>SUCCESS+</span>;
      case 'INSIDER':
      case 'insider':
        return <span className={styles.badgeInsider}>⭐ Insider</span>;
      default:
        return <span className={styles.badgeFree}>{tier}</span>;
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="SUCCESS+ Subscribers"
      description="Manage SUCCESS+ members and subscriptions"
    >
      <div className={styles.dashboard}>
        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total Subscribers</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.totalSubscribers.toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Active</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.activeSubscribers}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>On Trial</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.trialSubscribers}
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>❌</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Canceled</div>
              <div className={styles.statValue}>
                {loading ? '...' : stats.canceledSubscribers}
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className={styles.section}>
          <div className={styles.contentHeader}>
            <h2 className={styles.sectionTitle}>All Subscribers</h2>
            <div className={styles.filterBar}>
              <div className={styles.filterGroup}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Status:</label>
                <select
                  className={styles.filterSelect}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All ({stats.totalSubscribers})</option>
                  <option value="active">Active ({stats.activeSubscribers})</option>
                  <option value="trial">Trial ({stats.trialSubscribers})</option>
                  <option value="canceled">Canceled ({stats.canceledSubscribers})</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.contentTable}>
            {loading ? (
              <div className={styles.loading}>Loading subscribers...</div>
            ) : filteredSubscribers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <div>No subscribers found</div>
                {searchQuery && <p>Try adjusting your search terms</p>}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Member Since</th>
                    <th>Trial Ends</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{subscriber.name}</div>
                      </td>
                      <td>{subscriber.email}</td>
                      <td>{getTierBadge(subscriber.membershipTier)}</td>
                      <td>{getStatusBadge(subscriber.membershipStatus)}</td>
                      <td className={styles.dateCell}>
                        {new Date(subscriber.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className={styles.dateCell}>
                        {subscriber.trialEndsAt
                          ? new Date(subscriber.trialEndsAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/admin/members/${subscriber.id}`}
                            className={styles.actionButton}
                          >
                            View
                          </Link>
                          {subscriber.stripeCustomerId && (
                            <a
                              href={`https://dashboard.stripe.com/customers/${subscriber.stripeCustomerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionButton}
                            >
                              Stripe
                            </a>
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
