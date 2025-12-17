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

export default function NewStaffMember() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'EDITOR',
    primaryDepartment: 'EDITORIAL' as Department,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Only SUPER_ADMIN can directly add staff
      if (session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email is @success.com
    if (!formData.email.endsWith('@success.com')) {
      setError('Email must be a @success.com address');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          primaryDepartment: formData.primaryDepartment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create staff member');
      }

      setSuccess(true);

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'EDITOR',
        primaryDepartment: 'EDITORIAL' as Department,
      });

      // Redirect to staff list after 2 seconds
      setTimeout(() => {
        router.push('/admin/staff');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Add Staff Member</h1>
            <p className={styles.subtitle}>
              Create a new staff account with immediate access
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/staff')}
            className={styles.backButton}
          >
            ← Back to Staff
          </button>
        </div>

        <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
          <div className={styles.card} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Staff Information</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@success.com"
                  className={styles.input}
                  required
                />
                <small>Must be a @success.com email address</small>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className={styles.input}
                    minLength={8}
                    required
                  />
                  <small>At least 8 characters</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className={styles.input}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={styles.select}
                    required
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="AUTHOR">Author</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="department">Primary Department *</label>
                  <select
                    id="department"
                    value={formData.primaryDepartment}
                    onChange={(e) => setFormData({ ...formData, primaryDepartment: e.target.value as Department })}
                    className={styles.select}
                    required
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {success && (
                <div className={styles.success}>
                  ✓ Staff member created successfully! Redirecting...
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => router.push('/admin/staff')}
                  className={styles.backButton}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className={styles.submitButton}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
