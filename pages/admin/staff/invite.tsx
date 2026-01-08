/**
 * Staff Invitation Page
 * Allows admins to create invite codes for new staff members
 */
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from './StaffInvite.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

type Department =
  | 'SUPER_ADMIN'
  | 'CUSTOMER_SERVICE'
  | 'EDITORIAL'
  | 'SUCCESS_PLUS'
  | 'DEV'
  | 'MARKETING'
  | 'COACHING';

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'EDITORIAL', label: 'Editorial' },
  { value: 'SUCCESS_PLUS', label: 'SUCCESS+' },
  { value: 'DEV', label: 'Dev' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'COACHING', label: 'Coaching' },
];

interface InviteCode {
  code: string;
  email?: string;
  role: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  isActive: boolean;
  createdAt: string;
}

export default function StaffInvite() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Only SUPER_ADMIN and ADMIN can access
      if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
        router.push('/admin');
      } else {
        fetchInvites();
      }
    }
  }, [status, session, router]);

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invites/list');
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (err) {
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedCode('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          role,
          expiresInDays,
          maxUses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invite');
      }

      setGeneratedCode(data.invite.code);
      setSuccess('Invite code created successfully!');

      // Reset form
      setEmail('');
      setRole('EDITOR');
      setDepartments([]);
      setExpiresInDays(7);
      setMaxUses(1);

      // Refresh invites list
      fetchInvites();
    } catch (err: any) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const inviteUrl = `${window.location.origin}/register?invite=${generatedCode}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  const toggleDepartment = (dept: Department) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter(d => d !== dept));
    } else {
      setDepartments([...departments, dept]);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN';

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Invite Staff Member</h1>
            <p className={styles.subtitle}>
              Create invite codes for new staff members
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/staff')}
            className={styles.backButton}
          >
            ← Back to Staff
          </button>
        </div>

        <div className={styles.grid}>
          {/* Create Invite Form */}
          <div className={styles.card}>
            <h2>Create New Invite</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email (Optional)</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className={styles.input}
                />
                <small>Leave empty for a generic invite code</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                  <option value="AUTHOR">Author</option>
                  <option value="SOCIAL_TEAM">Social Team (Social Media & Email CRM only)</option>
                </select>
              </div>

              {isSuperAdmin && (
                <div className={styles.formGroup}>
                  <label>Department Access</label>
                  <div className={styles.departmentGrid}>
                    {DEPARTMENTS.map((dept) => (
                      <label key={dept.value} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={departments.includes(dept.value)}
                          onChange={() => toggleDepartment(dept.value)}
                          className={styles.checkbox}
                        />
                        {dept.label}
                      </label>
                    ))}
                  </div>
                  <small>Select departments the invited user will have access to</small>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="expiresInDays">Expires In (Days)</label>
                  <input
                    id="expiresInDays"
                    type="number"
                    min="1"
                    max="90"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="maxUses">Max Uses</label>
                  <input
                    id="maxUses"
                    type="number"
                    min="1"
                    max="100"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value))}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {success && (
                <div className={styles.success}>
                  {success}
                  {departments.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Note: Departments will be assigned automatically when the user registers.
                    </div>
                  )}
                </div>
              )}

              {generatedCode && (
                <div className={styles.codeBox}>
                  <div className={styles.codeLabel}>Invite Link:</div>
                  <div className={styles.code}>
                    {`${window.location.origin}/register?invite=${generatedCode}`}
                  </div>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className={styles.copyButton}
                  >
                    📋 Copy Link
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? 'Creating...' : 'Create Invite Code'}
              </button>
            </form>
          </div>

          {/* Active Invites List */}
          <div className={styles.card}>
            <h2>Recent Invites</h2>
            {loadingInvites ? (
              <div className={styles.loading}>Loading invites...</div>
            ) : invites.length === 0 ? (
              <div className={styles.empty}>No invites created yet</div>
            ) : (
              <div className={styles.invitesList}>
                {invites.slice(0, 10).map((invite) => (
                  <div key={invite.code} className={styles.inviteItem}>
                    <div className={styles.inviteHeader}>
                      <span className={styles.inviteCode}>{invite.code}</span>
                      <span
                        className={`${styles.inviteStatus} ${
                          invite.isActive ? styles.active : styles.inactive
                        }`}
                      >
                        {invite.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={styles.inviteDetails}>
                      {invite.email && (
                        <div className={styles.inviteDetail}>
                          📧 {invite.email}
                        </div>
                      )}
                      <div className={styles.inviteDetail}>
                        👤 {invite.role.replace('_', ' ')}
                      </div>
                      <div className={styles.inviteDetail}>
                        🔢 {invite.uses}/{invite.maxUses} uses
                      </div>
                      <div className={styles.inviteDetail}>
                        📅 Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
