import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Subscribers.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  type: string;
  recipientType: string;
  isComplimentary: boolean;
  status: string;
  subscribedAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    membershipTier: string;
  };
}

export default function SubscribersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [complimentaryFilter, setComplimentaryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role)) {
      router.push('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchSubscribers();
    }
  }, [session, page, typeFilter, recipientTypeFilter, complimentaryFilter, statusFilter, searchQuery]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(recipientTypeFilter !== 'all' && { recipientType: recipientTypeFilter }),
        ...(complimentaryFilter !== 'all' && { isComplimentary: complimentaryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/admin/subscribers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getRecipientTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      Customer: '#10b981',
      Agent: '#3b82f6',
      Staff: '#8b5cf6',
      Partner: '#f59e0b',
      Press: '#ef4444',
      Other: '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  const formatSubscriberType = (type: string) => {
    const formatted: Record<string, string> = {
      MagazinePrint: 'Magazine (Print)',
      MagazineDigital: 'Magazine (Digital)',
      SUCCESSPlus: 'SUCCESS+',
      CoachingProgram: 'Coaching Program',
      EmailNewsletter: 'Email Newsletter',
      All: 'All Subscriptions',
    };
    return formatted[type] || type;
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Subscribers</h1>
            <p className={styles.subtitle}>
              Manage all subscription types and recipients ({total} total)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Subscription Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Types</option>
              <option value="MagazinePrint">Magazine (Print)</option>
              <option value="MagazineDigital">Magazine (Digital)</option>
              <option value="SUCCESSPlus">SUCCESS+</option>
              <option value="CoachingProgram">Coaching Program</option>
              <option value="EmailNewsletter">Email Newsletter</option>
              <option value="All">All Subscriptions</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Recipient Type</label>
            <select
              value={recipientTypeFilter}
              onChange={(e) => setRecipientTypeFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Recipients</option>
              <option value="Customer">Customer</option>
              <option value="Agent">Agent</option>
              <option value="Staff">Staff</option>
              <option value="Partner">Partner</option>
              <option value="Press">Press</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Payment Status</label>
            <select
              value={complimentaryFilter}
              onChange={(e) => setComplimentaryFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All</option>
              <option value="false">Paid</option>
              <option value="true">Complimentary</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Bounced</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subscription Type</th>
                <th>Recipient Type</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No subscribers found
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>
                      {subscriber.firstName || subscriber.lastName
                        ? `${subscriber.firstName || ''} ${subscriber.lastName || ''}`.trim()
                        : '—'}
                      {subscriber.member && (
                        <span className={styles.memberBadge}>
                          {subscriber.member.membershipTier}
                        </span>
                      )}
                    </td>
                    <td>{subscriber.email}</td>
                    <td>
                      <span className={styles.typeBadge}>
                        {formatSubscriberType(subscriber.type)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.recipientBadge}
                        style={{
                          backgroundColor: getRecipientTypeBadgeColor(subscriber.recipientType),
                        }}
                      >
                        {subscriber.recipientType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.paymentBadge} ${
                          subscriber.isComplimentary
                            ? styles.complimentary
                            : styles.paid
                        }`}
                      >
                        {subscriber.isComplimentary ? 'Complimentary' : 'Paid'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[subscriber.status.toLowerCase()]
                        }`}
                      >
                        {subscriber.status}
                      </span>
                    </td>
                    <td>{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
