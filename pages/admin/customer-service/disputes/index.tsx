import { useState, useEffect } from 'react';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Disputes.module.css';

interface Dispute {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  stripeDisputeId?: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, page]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/admin/customer-service/disputes?${params}`);
      const data = await res.json();
      setDisputes(data.disputes || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      warning_needs_response: { class: styles.statusWarning, label: 'Needs Response' },
      warning_under_review: { class: styles.statusWarning, label: 'Under Review' },
      needs_response: { class: styles.statusDanger, label: 'Needs Response' },
      under_review: { class: styles.statusInfo, label: 'Under Review' },
      won: { class: styles.statusSuccess, label: 'Won' },
      lost: { class: styles.statusDanger, label: 'Lost' },
      charge_refunded: { class: styles.statusNeutral, label: 'Refunded' },
    };

    const config = statusConfig[status.toLowerCase()] || { class: styles.statusNeutral, label: status };

    return (
      <span className={`${styles.statusBadge} ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className={styles.overdue}>Overdue!</span>;
    if (diffDays === 0) return <span className={styles.urgent}>Due Today</span>;
    if (diffDays <= 3) return <span className={styles.urgent}>{diffDays} days</span>;
    return <span>{diffDays} days</span>;
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Disputes & Chargebacks"
      description="Track and respond to payment disputes"
    >
      <div className={styles.container}>
        {/* Header Actions */}
        <div className={styles.header}>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
          >
            + Create New Dispute
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className={styles.filterTabs}>
          {['all', 'needs_response', 'under_review', 'won', 'lost'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`${styles.filterTab} ${
                statusFilter === status ? styles.filterTabActive : ''
              }`}
            >
              {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Disputes Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading disputes...</div>
          ) : disputes.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⚖️</div>
              <div>No disputes found</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className={styles.emptyButton}
              >
                Create First Dispute
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Response Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td>
                      <div className={styles.customerInfo}>
                        <div className={styles.customerName}>{dispute.customerName}</div>
                        <div className={styles.customerEmail}>{dispute.customerEmail}</div>
                      </div>
                    </td>
                    <td className={styles.amount}>${dispute.amount.toFixed(2)}</td>
                    <td>{dispute.reason}</td>
                    <td>{getStatusBadge(dispute.status)}</td>
                    <td>{new Date(dispute.createdAt).toLocaleDateString()}</td>
                    <td>{getDaysRemaining(dispute.dueDate)}</td>
                    <td>
                      <Link
                        href={`/admin/customer-service/disputes/${dispute.id}`}
                        className={styles.actionButton}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}

        {/* Create Dispute Modal */}
        {showCreateModal && (
          <CreateDisputeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchDisputes();
            }}
          />
        )}
      </div>
    </DepartmentLayout>
  );
}

function CreateDisputeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    customerEmail: '',
    chargeId: '',
    amount: '',
    reason: 'fraudulent',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/customer-service/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      alert('Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Dispute</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Customer Email *</label>
            <input
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Charge/Payment ID *</label>
            <input
              type="text"
              required
              value={formData.chargeId}
              onChange={(e) => setFormData({ ...formData, chargeId: e.target.value })}
              placeholder="ch_xxxxx or pi_xxxxx"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Amount *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Reason *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <option value="fraudulent">Fraudulent</option>
              <option value="duplicate">Duplicate</option>
              <option value="product_not_received">Product Not Received</option>
              <option value="product_unacceptable">Product Unacceptable</option>
              <option value="subscription_canceled">Subscription Canceled</option>
              <option value="unrecognized">Unrecognized</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Internal Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any internal notes about this dispute..."
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Creating...' : 'Create Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
