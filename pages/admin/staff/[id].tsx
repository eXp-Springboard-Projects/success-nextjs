/**
 * Staff Member Detail View
 * Display full profile and activity for a staff member
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import styles from './StaffDetail.module.css';
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
  bio?: string;
  avatar?: string;
  departments?: string[];
}

export default function StaffDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [savingDepartments, setSavingDepartments] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (id && session) {
      fetchStaffMember();
    }
  }, [id, session]);

  const fetchStaffMember = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch staff member');
      }
      const data = await res.json();

      // Fetch departments if available
      try {
        const deptRes = await fetch(`/api/admin/departments/user-departments?userId=${id}`);
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          data.departments = deptData.departments;
          setSelectedDepartments(deptData.departments || []);
        }
      } catch (err) {
      }

      setStaff(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      alert('Please provide both subject and message');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ Email sent successfully to ${data.recipient.name}`);
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailMessage('');
      } else {
        alert(`✗ Failed to send email: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email to this staff member?')) return;

    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forceChangeOnLogin: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ Password reset email sent to ${data.recipient.name}`);
      } else {
        alert(`✗ Failed to send reset email: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSaveDepartments = async () => {
    setSavingDepartments(true);
    try {
      const res = await fetch(`/api/admin/departments/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          departments: selectedDepartments,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✓ Departments updated successfully');
        setShowDepartmentModal(false);
        fetchStaffMember(); // Refresh data
      } else {
        alert(`✗ Failed to update departments: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to update departments');
    } finally {
      setSavingDepartments(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!confirm(`Are you sure you want to delete ${staff?.name}? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('⚠️ FINAL WARNING: This will permanently delete this staff member and all their data. Continue?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        alert('✓ Staff member deleted successfully');
        router.push('/admin/staff');
      } else {
        alert(`✗ Failed to delete staff member: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to delete staff member');
    }
  };

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const availableDepartments = [
    'SUPER_ADMIN',
    'CUSTOMER_SERVICE',
    'EDITORIAL',
    'SUCCESS_PLUS',
    'DEV',
    'MARKETING',
    'COACHING',
  ];

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading staff member...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !staff) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            {error || 'Staff member not found'}
          </div>
          <Link href="/admin/staff" className={styles.backLink}>
            ← Back to Staff List
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/staff" className={styles.backLink}>
            ← Back to Staff List
          </Link>
          <Link href={`/admin/staff/${id}/edit`} className={styles.editButton}>
            ✏️ Edit Staff Member
          </Link>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {staff.avatar ? (
                <img src={staff.avatar} alt={staff.name} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {staff.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1>{staff.name}</h1>
              <p className={styles.email}>{staff.email}</p>
              <div className={styles.badges}>
                <span className={styles.roleBadge}>{staff.role.replace('_', ' ')}</span>
                <span className={`${styles.statusBadge} ${staff.emailVerified ? styles.active : styles.inactive}`}>
                  {staff.emailVerified ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {staff.bio && (
            <div className={styles.bio}>
              <h3>Bio</h3>
              <p>{staff.bio}</p>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Account Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Member Since</div>
                <div className={styles.infoValue}>{formatDate(staff.createdAt)}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Last Login</div>
                <div className={styles.infoValue}>{formatDate(staff.lastLoginAt)}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Email Verified</div>
                <div className={styles.infoValue}>
                  {staff.emailVerified ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Posts Authored</div>
                <div className={styles.infoValue}>{staff.postsCount || 0}</div>
              </div>
            </div>
          </div>

          {staff.departments && staff.departments.length > 0 && (
            <div className={styles.card}>
              <h3>Department Access</h3>
              <div className={styles.departmentList}>
                {staff.departments.map((dept) => (
                  <span key={dept} className={styles.deptBadge}>
                    {dept.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionsCard}>
          <h3>Actions</h3>
          <div className={styles.actionButtons}>
            <Link href={`/admin/staff/${id}/edit`} className={styles.actionButton}>
              ✏️ Edit Profile
            </Link>
            <button className={styles.actionButton} onClick={() => setShowEmailModal(true)}>
              📧 Send Email
            </button>
            <button className={styles.actionButton} onClick={handleResetPassword} disabled={resettingPassword}>
              🔐 {resettingPassword ? 'Sending...' : 'Reset Password'}
            </button>
            {session?.user?.role === 'SUPER_ADMIN' && (
              <>
                <button className={styles.actionButton} onClick={() => setShowDepartmentModal(true)}>
                  🏢 Assign Departments
                </button>
                <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={handleDeleteStaff}>
                  🗑️ Delete Staff Member
                </button>
              </>
            )}
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Send Email to {staff.name}</h2>
                <button className={styles.closeButton} onClick={() => setShowEmailModal(false)}>
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="emailSubject">Subject</label>
                  <input
                    id="emailSubject"
                    type="text"
                    className={styles.input}
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="emailMessage">Message</label>
                  <textarea
                    id="emailMessage"
                    className={styles.textarea}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your message"
                    rows={8}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button
                  className={styles.sendButton}
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? 'Sending...' : '📧 Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Assignment Modal */}
        {showDepartmentModal && session?.user?.role === 'SUPER_ADMIN' && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Assign Departments to {staff.name}</h2>
                <button className={styles.closeButton} onClick={() => setShowDepartmentModal(false)}>
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                  Select which departments this staff member should have access to:
                </p>
                <div className={styles.departmentCheckboxes}>
                  {availableDepartments.map((dept) => (
                    <label key={dept} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept)}
                        onChange={() => toggleDepartment(dept)}
                        className={styles.checkbox}
                      />
                      <span>{dept.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowDepartmentModal(false)}
                  disabled={savingDepartments}
                >
                  Cancel
                </button>
                <button
                  className={styles.sendButton}
                  onClick={handleSaveDepartments}
                  disabled={savingDepartments}
                >
                  {savingDepartments ? 'Saving...' : '💾 Save Departments'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
