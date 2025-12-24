import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import styles from '../editorial/Editorial.module.css';

interface PendingStaff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export default function PendingStaff() {
  const [pendingUsers, setPendingUsers] = useState<PendingStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalModal, setApprovalModal] = useState<PendingStaff | null>(null);
  const [approvalData, setApprovalData] = useState({
    role: 'EDITOR',
    department: 'EDITORIAL',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch('/api/admin/staff/pending');
      const data = await res.json();
      setPendingUsers(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalModal) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/staff/${approvalModal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData),
      });

      if (res.ok) {
        setApprovalModal(null);
        fetchPendingUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve user');
      }
    } catch (error) {
      alert('Failed to approve user');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this staff request?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${userId}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchPendingUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject user');
      }
    } catch (error) {
      alert('Failed to reject user');
    }
  };

  return (
    <DepartmentLayout
      currentDepartment={Department.SUPER_ADMIN}
      pageTitle="Pending Staff Approvals"
      description="Review and approve staff signup requests"
    >
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1>Pending Staff Approvals</h1>
            <p>Review and approve staff members waiting for account activation</p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Pending Requests</div>
              <div className={styles.statValue}>{loading ? '...' : pendingUsers.length}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.section}>
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : pendingUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✓</div>
              <div>No pending staff requests</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Requested Date
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: '#6b7280',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        {user.firstName} {user.lastName}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => setApprovalModal(user)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setApprovalModal(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>
              Approve Staff Member
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                <strong>Name:</strong> {approvalModal.firstName} {approvalModal.lastName}
              </p>
              <p style={{ margin: '0', color: '#6b7280' }}>
                <strong>Email:</strong> {approvalModal.email}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Assign Role
              </label>
              <select
                value={approvalData.role}
                onChange={(e) => setApprovalData({ ...approvalData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                <option value="EDITOR">Editor</option>
                <option value="AUTHOR">Author</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Assign Department
              </label>
              <select
                value={approvalData.department}
                onChange={(e) =>
                  setApprovalData({ ...approvalData, department: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              >
                <option value="EDITORIAL">Editorial</option>
                <option value="MARKETING">Marketing</option>
                <option value="CUSTOMER_SERVICE">Customer Service</option>
                <option value="SUCCESS_PLUS">SUCCESS+</option>
                <option value="COACHING">Coaching</option>
                <option value="DEV">Development</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setApprovalModal(null)}
                disabled={processing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: processing ? 0.6 : 1,
                }}
              >
                {processing ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DepartmentLayout>
  );
}

export const getServerSideProps = requireDepartmentAuth(Department.SUPER_ADMIN);
