import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import styles from './Refunds.module.css';

interface RefundDetail {
  id: string;
  customerName: string;
  customerEmail: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  status: string;
  createdAt: string;
  processedBy: string;
  paymentId: string;
  notes?: string;
}

export default function RefundDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRefund();
    }
  }, [id]);

  const fetchRefund = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customer-service/refunds/${id}`);
      const data = await res.json();
      setRefund(data.refund);
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
      processing: { class: styles.statusInfo, label: 'Processing' },
    };

    const config = statusConfig[status.toLowerCase()] || { class: styles.statusNeutral, label: status };

    return (
      <span className={`${styles.statusBadge} ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Refund Details"
        description="Loading..."
      >
        <div className={styles.loading}>Loading refund details...</div>
      </DepartmentLayout>
    );
  }

  if (!refund) {
    return (
      <DepartmentLayout
        currentDepartment={Department.CUSTOMER_SERVICE}
        pageTitle="Refund Not Found"
        description="Error"
      >
        <div className={styles.empty}>Refund not found</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout
      currentDepartment={Department.CUSTOMER_SERVICE}
      pageTitle={`Refund #${refund.id.slice(-8)}`}
      description="Refund details and history"
    >
      <div className={styles.detailContainer}>
        <div className={styles.backLink}>
          <Link href="/admin/customer-service/refunds">← Back to Refunds</Link>
        </div>

        {/* Refund Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Refund Information</h2>
            {getStatusBadge(refund.status)}
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Customer</label>
                <div className={styles.infoValue}>
                  <div>{refund.customerName}</div>
                  <div className={styles.infoSubtext}>{refund.customerEmail}</div>
                </div>
              </div>
              <div className={styles.infoItem}>
                <label>Original Amount</label>
                <div className={styles.infoValue}>${refund.originalAmount.toFixed(2)}</div>
              </div>
              <div className={styles.infoItem}>
                <label>Refund Amount</label>
                <div className={styles.infoValue} style={{ color: '#ef4444' }}>
                  -${refund.refundAmount.toFixed(2)}
                </div>
              </div>
              <div className={styles.infoItem}>
                <label>Reason</label>
                <div className={styles.infoValue}>{refund.reason}</div>
              </div>
              <div className={styles.infoItem}>
                <label>Payment ID</label>
                <div className={styles.infoValue}>{refund.paymentId}</div>
              </div>
              <div className={styles.infoItem}>
                <label>Created</label>
                <div className={styles.infoValue}>
                  {new Date(refund.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={styles.infoItem}>
                <label>Processed By</label>
                <div className={styles.infoValue}>{refund.processedBy}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Actions</h2>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.actionButtons}>
              <button
                onClick={() => setShowEditModal(true)}
                className={styles.primaryButton}
              >
                Update Status
              </button>
              <button
                onClick={() => setShowNotesModal(true)}
                className={styles.secondaryButton}
              >
                Add Notes
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {refund.notes && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Internal Notes</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.notes}>{refund.notes}</div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showEditModal && (
          <UpdateStatusModal
            refundId={refund.id}
            currentStatus={refund.status}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchRefund();
            }}
          />
        )}

        {/* Add Notes Modal */}
        {showNotesModal && (
          <AddNotesModal
            refundId={refund.id}
            onClose={() => setShowNotesModal(false)}
            onSuccess={() => {
              setShowNotesModal(false);
              fetchRefund();
            }}
          />
        )}
      </div>
    </DepartmentLayout>
  );
}

function UpdateStatusModal({
  refundId,
  currentStatus,
  onClose,
  onSuccess,
}: {
  refundId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/customer-service/refunds/${refundId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Refund Status</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>New Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this status change..."
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddNotesModal({
  refundId,
  onClose,
  onSuccess,
}: {
  refundId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/customer-service/refunds/${refundId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add notes');
      }
    } catch (error) {
      alert('Failed to add notes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add Notes</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Notes *</label>
            <textarea
              rows={6}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this refund..."
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.CUSTOMER_SERVICE);
