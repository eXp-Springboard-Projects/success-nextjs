import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import BulkStaffOperations from '../../../components/admin/BulkStaffOperations';
import styles from './Staff.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  postsCount?: number;
}

export default function StaffManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Only SUPER_ADMIN and ADMIN can access staff management
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchStaff();
    }
  }, [session]);

  const fetchStaff = async () => {
    try {
      setLoading(true);

      // Fetch staff from API endpoint (now returns valid JSON)
      const response = await fetch('/api/admin/staff');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff');
      }

      setStaff(data.staff || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '#d32f2f';
      case 'ADMIN':
        return '#8b5cf6';
      case 'EDITOR':
        return '#3b82f6';
      case 'AUTHOR':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleResendInvite = async (memberId: string, memberName: string, memberEmail: string) => {
    if (!confirm(`Send invitation email to ${memberName} (${memberEmail})?`)) {
      return;
    }

    setResendingInvite(memberId);
    setError('');

    try {
      const response = await fetch(`/api/admin/staff/${memberId}/resend-invite`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      alert(`✅ Invitation email sent to ${memberName}!`);
    } catch (err: any) {
      setError(err.message);
      alert(`❌ Failed to send invitation: ${err.message}`);
    } finally {
      setResendingInvite(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading staff data...</div>
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
            <h1>Staff Management</h1>
            <p className={styles.subtitle}>
              Manage staff members, roles, and permissions
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => setShowBulkOps(!showBulkOps)}
              className={styles.bulkOpsButton}
            >
              {showBulkOps ? '✕ Close' : '⚡'} Bulk Operations
            </button>
            {session?.user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => router.push('/admin/staff/new')}
                className={styles.primaryButton}
              >
                + Add Staff
              </button>
            )}
            <button
              onClick={() => router.push('/admin/staff/invite')}
              className={styles.secondaryButton}
            >
              📧 Invite One
            </button>
            <button
              onClick={() => router.push('/admin/staff/bulk-invite')}
              className={styles.primaryButton}
            >
              📬 Bulk Invite
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {showBulkOps && (
          <BulkStaffOperations onComplete={fetchStaff} />
        )}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fee' }}>
              <span style={{ color: '#d32f2f' }}>👑</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {staff.filter(s => s.role === 'SUPER_ADMIN').length}
              </div>
              <div className={styles.statLabel}>Super Admins</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#f3e8ff' }}>
              <span style={{ color: '#8b5cf6' }}>🛡️</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {staff.filter(s => s.role === 'ADMIN').length}
              </div>
              <div className={styles.statLabel}>Admins</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
              <span style={{ color: '#3b82f6' }}>✏️</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {staff.filter(s => s.role === 'EDITOR').length}
              </div>
              <div className={styles.statLabel}>Editors</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#d1fae5' }}>
              <span style={{ color: '#10b981' }}>📝</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {staff.filter(s => s.role === 'AUTHOR').length}
              </div>
              <div className={styles.statLabel}>Authors</div>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Posts</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className={styles.staffInfo}>
                      <div className={styles.staffAvatar}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.staffName}>{member.name}</div>
                        <div className={styles.staffEmail}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={styles.roleBadge}
                      style={{ background: getRoleBadgeColor(member.role) }}
                    >
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          background: member.emailVerified ? '#d1fae5' : '#fee',
                          color: member.emailVerified ? '#065f46' : '#991b1b',
                        }}
                      >
                        {member.emailVerified ? 'Active' : 'Inactive'}
                      </span>
                      {member.lastLoginAt && (
                        <span style={{ color: '#10b981', fontSize: '1.25rem' }} title={`Last login: ${formatDate(member.lastLoginAt)}`}>
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{member.postsCount || 0}</td>
                  <td>{formatDate(member.createdAt)}</td>
                  <td>{formatDate(member.lastLoginAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => router.push(`/admin/staff/${member.id}`)}
                        className={styles.actionButton}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => router.push(`/admin/staff/${member.id}/edit`)}
                        className={styles.actionButton}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleResendInvite(member.id, member.name, member.email)}
                        className={styles.actionButton}
                        title="Resend Invitation Email"
                        disabled={resendingInvite === member.id}
                      >
                        {resendingInvite === member.id ? '⏳' : '📧'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {staff.length === 0 && (
            <div className={styles.emptyState}>
              <p>No staff members found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR for AWS Amplify deployment compatibility

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
