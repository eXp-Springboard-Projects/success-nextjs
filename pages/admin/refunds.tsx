/**
 * Refunds & Disputes Management
 * Track and manage refund requests and payment disputes with SLA tracking
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Refunds.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Refund {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  type: 'Refund' | 'Chargeback' | 'Dispute' | 'Inquiry';
  status: string;
  priority: string;
  requestDate: string;
  slaDeadline: string;
  assignedTo?: string;
  reason?: string;
}

export default function RefundsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      } else {
        fetchRefunds();
      }
    }
  }, [status, session, router]);

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`/api/admin/refunds?status=${statusFilter}&type=${typeFilter}&search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setRefunds(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRefunds();
    }
  }, [statusFilter, typeFilter, searchTerm]);

  const handleStatusUpdate = async (refundId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchRefunds();
      }
    } catch (error) {
    }
  };

  const getTimeUntilSLA = (slaDeadline: string) => {
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return { text: 'OVERDUE', color: '#ef4444', urgent: true };
    if (hours < 24) return { text: `${hours}h`, color: '#f59e0b', urgent: true };
    const days = Math.floor(hours / 24);
    return { text: `${days}d`, color: '#10b981', urgent: false };
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'UNDERREVIEW':
        return '#3b82f6';
      case 'DENIED':
        return '#ef4444';
      case 'CLOSED':
        return '#6b7280';
      case 'ESCALATED':
        return '#dc2626';
      default:
        return '#999';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Refund':
        return '💰';
      case 'Chargeback':
        return '⚠️';
      case 'Dispute':
        return '⚔️';
      case 'Inquiry':
        return '❓';
      default:
        return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'VIP':
        return '#fbbf24';
      case 'HIGH':
        return '#f59e0b';
      case 'STANDARD':
        return '#6b7280';
      default:
        return '#999';
    }
  };

  const exportToCSV = () => {
    const headers = ['Ticket #', 'Customer', 'Email', 'Type', 'Amount', 'Status', 'Priority', 'SLA', 'Date'];
    const rows = refunds.map(refund => [
      refund.ticketNumber,
      refund.customerName,
      refund.customerEmail,
      refund.type,
      `$${refund.amount}`,
      refund.status,
      refund.priority,
      getTimeUntilSLA(refund.slaDeadline).text,
      new Date(refund.requestDate).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refunds-disputes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading refunds & disputes...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const pendingCount = refunds.filter(r => r.status === 'Pending').length;
  const urgentCount = refunds.filter(r => getTimeUntilSLA(r.slaDeadline).urgent).length;
  const approvedCount = refunds.filter(r => r.status === 'Approved').length;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Refunds & Disputes</h1>
            <p>Manage refund requests and payment disputes with SLA tracking</p>
          </div>
          <button onClick={exportToCSV} className={styles.exportButton}>
            📥 Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#f59e0b' }}>⏳</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending Review</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#ef4444' }}>🚨</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{urgentCount}</div>
              <div className={styles.statLabel}>SLA Urgent</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#10b981' }}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{approvedCount}</div>
              <div className={styles.statLabel}>Approved</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#8b5cf6' }}>📋</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{refunds.length}</div>
              <div className={styles.statLabel}>Total Cases</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by ticket number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="Refund">Refunds</option>
            <option value="Chargeback">Chargebacks</option>
            <option value="Dispute">Disputes</option>
            <option value="Inquiry">Inquiries</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
            <option value="Escalated">Escalated</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Refunds Table */}
        <div className={styles.tableContainer}>
          {refunds.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No refunds or disputes found</p>
              <p className={styles.emptyNote}>
                All refund requests and payment disputes will appear here
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>SLA</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => {
                  const sla = getTimeUntilSLA(refund.slaDeadline);
                  return (
                    <tr key={refund.id}>
                      <td className={styles.ticketNumber}>{refund.ticketNumber}</td>
                      <td>
                        <span className={styles.typeIcon}>{getTypeIcon(refund.type)}</span>
                        {refund.type}
                      </td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>{refund.customerName}</div>
                          <div className={styles.customerEmail}>{refund.customerEmail}</div>
                        </div>
                      </td>
                      <td className={styles.amount}>${refund.amount.toFixed(2)}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ background: getStatusColor(refund.status) }}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.priorityBadge}
                          style={{ color: getPriorityColor(refund.priority) }}
                        >
                          {refund.priority === 'VIP' && '⭐ '}
                          {refund.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.slaBadge}
                          style={{
                            background: sla.color,
                            fontWeight: sla.urgent ? '700' : '600',
                          }}
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td>{new Date(refund.requestDate).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            onClick={() => router.push(`/admin/refunds/${refund.id}`)}
                            className={styles.viewButton}
                            title="View Details"
                          >
                            👁️
                          </button>
                          {refund.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(refund.id, 'Approved')}
                                className={styles.approveButton}
                                title="Approve"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(refund.id, 'Denied')}
                                className={styles.denyButton}
                                title="Deny"
                              >
                                ❌
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
