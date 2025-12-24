import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';
import styles from '../../editorial/Editorial.module.css';

interface Promotion {
  id: string;
  code: string;
  discount_type: string;
  discount_amount: number;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  status: string;
  description: string | null;
  created_at: string;
}

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountAmount: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    description: '',
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/crm/promotions');
      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/crm/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountAmount: parseFloat(formData.discountAmount),
          minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
          maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          expiresAt: formData.expiresAt || null,
          description: formData.description || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({
          code: '',
          discountType: 'percentage',
          discountAmount: '',
          minPurchaseAmount: '',
          maxDiscountAmount: '',
          usageLimit: '',
          expiresAt: '',
          description: '',
        });
        fetchPromotions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create promotion');
      }
    } catch (error) {
      alert('Failed to create promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion? This action cannot be undone.')) return;

    try {
      await fetch(`/api/admin/crm/promotions/${id}`, {
        method: 'DELETE',
      });
      fetchPromotions();
    } catch (error) {
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await fetch(`/api/admin/crm/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPromotions();
    } catch (error) {
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No expiry';
    const d = new Date(date);
    const now = new Date();
    if (d < now) return <span style={{ color: '#ef4444' }}>Expired</span>;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDiscount = (type: string, amount: number) => {
    if (type === 'percentage') {
      return `${amount}%`;
    }
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Promotions">
        <div className={styles.loading}>Loading promotions...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.MARKETING} pageTitle="Promotions">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Promotions & Coupon Codes</h1>
            <p>Manage discount codes and promotional offers</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setShowModal(true)}
          >
            + Create Promotion
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Type</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                      {promo.code}
                    </strong>
                    {promo.description && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {promo.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: '#22c55e', fontSize: '1.125rem' }}>
                      {formatDiscount(promo.discount_type, promo.discount_amount)}
                    </strong>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{promo.discount_type}</td>
                  <td>
                    {promo.usage_count}{promo.usage_limit ? ` / ${promo.usage_limit}` : ' (unlimited)'}
                  </td>
                  <td>{formatDate(promo.expires_at)}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: promo.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color: promo.status === 'active' ? '#166534' : '#6b7280',
                      }}
                    >
                      {promo.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleToggleStatus(promo.id, promo.status)}
                      >
                        {promo.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(promo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {promotions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎁</div>
              <div>No promotions yet. Click "Create Promotion" to add your first offer.</div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Create Promotion</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Discount Type *</label>
                    <select
                      className={styles.input}
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Discount Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Min Purchase Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Max Discount Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Expires At</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Internal notes about this promotion..."
                    rows={3}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryButton}>
                    Create Promotion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}
