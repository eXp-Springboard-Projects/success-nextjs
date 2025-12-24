import { useState, useEffect } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Refunds.module.css';

interface Refund {
  id: string;
  customerName: string;
  customerEmail: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  processedBy: string;
  createdAt: string;
  status: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRefunds();
  }, [dateRange, page]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/admin/customer-service/refunds?${params}`);
      const data = await res.json();
      setRefunds(data.refunds || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      completed: { class: styles.statusSuccess, label: 'Completed' },
      pending: { class: styles.statusWarning, label: 'Pending' },
      failed: { class: styles.statusDanger, label: 'Failed' },
    };

    const config = statusConfig[status.toLowerCase()] || { class: styles.statusNeutral, label: status };

    return (
      <span className={`${styles.statusBadge} ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle="Refunds & Disputes"
      description="Process refunds and manage disputes"
    >
      <div className={styles.container}>
        {/* Action Buttons */}
        <div className={styles.header}>
          <div className={styles.actionButtons}>
            <button
              onClick={() => setShowRefundModal(true)}
              className={styles.primaryButton}
            >
              + Process New Refund
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              className={styles.secondaryButton}
            >
              + Create Dispute
            </button>
            <Link
              href="/admin/customer-service/disputes"
              className={styles.linkButton}
            >
              View All Disputes
            </Link>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className={styles.filters}>
          <div className={styles.dateFilter}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className={styles.dateFilter}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button onClick={() => setDateRange({ start: '', end: '' })} className={styles.clearButton}>
            Clear Dates
          </button>
        </div>

        {/* Refunds Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading refunds...</div>
          ) : refunds.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>=�</div>
              <div>No refunds found</div>
              <button
                onClick={() => setShowRefundModal(true)}
                className={styles.emptyButton}
              >
                Process First Refund
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Original Amount</th>
                  <th>Refund Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Processed By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{new Date(refund.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.customerInfo}>
                        <div className={styles.customerName}>{refund.customerName}</div>
                        <div className={styles.customerEmail}>{refund.customerEmail}</div>
                      </div>
                    </td>
                    <td>${refund.originalAmount.toFixed(2)}</td>
                    <td className={styles.refundAmount}>-${refund.refundAmount.toFixed(2)}</td>
                    <td>{refund.reason}</td>
                    <td>{getStatusBadge(refund.status)}</td>
                    <td>{refund.processedBy}</td>
                    <td>
                      <Link
                        href={`/admin/customer-service/refunds/${refund.id}`}
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

        {/* Process Refund Modal */}
        {showRefundModal && (
          <ProcessRefundModal
            onClose={() => setShowRefundModal(false)}
            onSuccess={() => {
              setShowRefundModal(false);
              fetchRefunds();
            }}
          />
        )}

        {/* Create Dispute Modal */}
        {showDisputeModal && (
          <CreateDisputeModal
            onClose={() => setShowDisputeModal(false)}
            onSuccess={() => {
              setShowDisputeModal(false);
            }}
          />
        )}
      </div>
    </DepartmentLayout>
  );
}

function ProcessRefundModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    customerEmail: '',
    paymentId: '',
    amount: '',
    refundType: 'full',
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/customer-service/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process refund');
      }
    } catch (error) {
      alert('Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Process Refund</h2>
          <button onClick={onClose} className={styles.closeButton}></button>
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
            <label>Payment/Charge ID *</label>
            <input
              type="text"
              required
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              placeholder="ch_xxxxx or pi_xxxxx"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Refund Type *</label>
            <select
              value={formData.refundType}
              onChange={(e) => setFormData({ ...formData, refundType: e.target.value })}
            >
              <option value="full">Full Refund</option>
              <option value="partial">Partial Refund</option>
            </select>
          </div>

          {formData.refundType === 'partial' && (
            <div className={styles.formGroup}>
              <label>Refund Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Reason *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            >
              <option value="">Select reason...</option>
              <option value="customer_request">Customer Request</option>
              <option value="duplicate_charge">Duplicate Charge</option>
              <option value="fraudulent">Fraudulent</option>
              <option value="product_issue">Product Issue</option>
              <option value="service_issue">Service Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Internal Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any internal notes..."
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
        alert('Dispute created successfully!');
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create dispute');
      }
    } catch (error) {
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
          <button onClick={onClose} className={styles.closeButton}></button>
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
            <label>Dispute Amount *</label>
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
              placeholder="Add details about this dispute..."
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
