import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './SmsSubscribers.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface SmsSubscriber {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  active: boolean;
  subscribed_at: string;
  resubscribed_at?: string;
  unsubscribed_at?: string;
  created_at: string;
}

export default function SmsSubscribersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<SmsSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

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
  }, [session, page, statusFilter, searchQuery]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/admin/sms-subscribers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers);
        setTotal(data.total);
        setActiveCount(data.activeCount);
        setInactiveCount(data.inactiveCount);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching SMS subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
        export: 'csv',
      });

      const res = await fetch(`/api/admin/sms-subscribers?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sms-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      alert('Failed to export subscribers');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this subscriber?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sms-subscribers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (res.ok) {
        fetchSubscribers();
      } else {
        alert('Failed to update subscriber status');
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
      alert('Failed to update subscriber status');
    }
  };

  if (status === 'loading' || !session) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Daily SMS Subscribers</h1>
            <p className={styles.subtitle}>
              Manage subscribers to daily inspirational quotes via SMS
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={exporting || total === 0}
            className={styles.exportButton}
          >
            {exporting ? 'Exporting...' : '📥 Export to CSV'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{total.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Subscribers</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statSuccess}`}>
              {activeCount.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statMuted}`}>
              {inactiveCount.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Inactive</div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={styles.select}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Search:</label>
            <input
              type="text"
              placeholder="Name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loading}>Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📱</div>
            <div className={styles.emptyText}>No SMS subscribers found</div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className={styles.clearButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Subscribed</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td>
                        <div className={styles.name}>
                          {subscriber.first_name} {subscriber.last_name}
                        </div>
                      </td>
                      <td>
                        <code className={styles.phone}>{subscriber.phone}</code>
                      </td>
                      <td>
                        <a href={`mailto:${subscriber.email}`} className={styles.email}>
                          {subscriber.email}
                        </a>
                      </td>
                      <td>
                        <div className={styles.date}>
                          {new Date(subscriber.subscribed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {subscriber.resubscribed_at && (
                          <div className={styles.resubscribed}>
                            Resubscribed: {new Date(subscriber.resubscribed_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            subscriber.active ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {subscriber.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(subscriber.id, subscriber.active)}
                          className={styles.actionButton}
                        >
                          {subscriber.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={styles.paginationButton}
                >
                  ← Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className={styles.paginationButton}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
